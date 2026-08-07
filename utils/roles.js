/**
 * Does this user get RM Member (special) pricing?
 *
 * This must stay an EXACT role match. A substring test on "agent" also matches
 * "marketing_agent", which quoted Marketing Executives the discounted price
 * they are not entitled to.
 *
 * The server bills on `user.roles.includes("agent")` in createMedicineOrder,
 * so anything looser here makes the cart disagree with the invoice.
 */
export const hasAgentPricing = (user) =>
  Array.isArray(user?.roles) && user.roles.includes("agent");
