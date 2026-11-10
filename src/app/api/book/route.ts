import { postToGhl } from "@/lib/ghl";
import { handleBookingEnquiry } from "@/lib/public-enquiry";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleBookingEnquiry(request, (payload) => postToGhl(payload));
}
