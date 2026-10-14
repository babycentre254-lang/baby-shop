/**
 * Human-readable messages for every relevant Safaricom M-Pesa result code.
 * Reference: Daraja API result codes.
 */
export interface ResultCodeInfo {
  code: number;
  label: string;
  /** Message shown to the customer */
  userMessage: string;
  /** Whether the customer can retry */
  retryable: boolean;
  /** Whether it should be treated as a successful payment */
  success: boolean;
}

export const MPESA_RESULT_CODES: Record<number, ResultCodeInfo> = {
  0: {
    code: 0,
    label: "SUCCESS",
    userMessage: "Payment received successfully.",
    retryable: false,
    success: true,
  },
  1: {
    code: 1,
    label: "INSUFFICIENT_FUNDS",
    userMessage:
      "You don't have enough money in your M-Pesa account. Top up and try again.",
    retryable: true,
    success: false,
  },
  17: {
    code: 17,
    label: "RULE_LIMIT",
    userMessage:
      "The transaction would exceed your M-Pesa daily limit. Try a smaller amount or try tomorrow.",
    retryable: true,
    success: false,
  },
  18: {
    code: 18,
    label: "TOO_MANY_REQUESTS",
    userMessage:
      "Too many M-Pesa requests. Please wait a moment before trying again.",
    retryable: true,
    success: false,
  },
  26: {
    code: 26,
    label: "SYSTEM_BUSY",
    userMessage:
      "M-Pesa is temporarily busy. Please try again in a few moments.",
    retryable: true,
    success: false,
  },
  1001: {
    code: 1001,
    label: "UNABLE_TO_LOCK_SUBSCRIBER",
    userMessage:
      "We couldn't reach your M-Pesa account. Make sure your SIM is active and try again.",
    retryable: true,
    success: false,
  },
  1002: {
    code: 1002,
    label: "REQUEST_CANCELLED",
    userMessage: "You cancelled the payment prompt on your phone.",
    retryable: true,
    success: false,
  },
  1019: {
    code: 1019,
    label: "TRANSACTION_EXPIRED",
    userMessage:
      "The payment prompt expired before you entered your PIN. Please try again.",
    retryable: true,
    success: false,
  },
  1032: {
    code: 1032,
    label: "CANCELLED_BY_USER",
    userMessage:
      "You cancelled the payment prompt. No money was deducted. You can try again.",
    retryable: true,
    success: false,
  },
  1037: {
    code: 1037,
    label: "NO_RESPONSE_FROM_USER",
    userMessage:
      "We didn't receive a response from your phone. Make sure your phone is on and has network, then try again.",
    retryable: true,
    success: false,
  },
  2001: {
    code: 2001,
    label: "WRONG_PIN",
    userMessage:
      "The M-Pesa PIN you entered was incorrect. Please try again carefully.",
    retryable: true,
    success: false,
  },
  2002: {
    code: 2002,
    label: "PIN_LOCKED",
    userMessage:
      "Your M-Pesa PIN has been locked after too many wrong attempts. Please contact Safaricom on 100.",
    retryable: false,
    success: false,
  },
  2006: {
    code: 2006,
    label: "INVALID_INITIATOR",
    userMessage:
      "There was a problem initiating the payment. Please contact support.",
    retryable: false,
    success: false,
  },
  // ─── Fallback for unknown codes ───
  [-1]: {
    code: -1,
    label: "UNKNOWN",
    userMessage:
      "The payment could not be completed. Please try again or contact support.",
    retryable: true,
    success: false,
  },
};

export function lookupResultCode(code: number | undefined): ResultCodeInfo {
  if (code === undefined || code === null) {
    return MPESA_RESULT_CODES[-1];
  }
  return MPESA_RESULT_CODES[code] ?? MPESA_RESULT_CODES[-1];
}