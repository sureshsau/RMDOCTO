import { toUploadFile } from "../components/shared/appointment/PrescriptionPicker";
import api from "../services/axios";

/**
 * Book an appointment, optionally attaching a prescription in the same request.
 *
 * Without a prescription the payload goes as plain JSON (unchanged behaviour).
 * With one, it switches to multipart/form-data — the server accepts both.
 *
 * @returns the API response body, which carries `warning` when the booking
 *          succeeded but the prescription upload did not.
 */
export async function bookAppointment(payload, prescriptionAsset) {
  if (!prescriptionAsset) {
    const res = await api.post("/appointment", payload);
    return res.data;
  }

  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    formData.append(key, String(value));
  });

  formData.append("prescription", toUploadFile(prescriptionAsset));

  const res = await api.post("/appointment", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data;
}

/** Attach or replace the prescription on an existing appointment. */
export async function uploadAppointmentPrescription(appointmentId, asset) {
  const formData = new FormData();
  formData.append("prescription", toUploadFile(asset));

  const res = await api.post(
    `/appointment/${appointmentId}/prescription`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
}

/** Remove the prescription from an appointment. */
export async function deleteAppointmentPrescription(appointmentId) {
  const res = await api.delete(`/appointment/${appointmentId}/prescription`);
  return res.data;
}
