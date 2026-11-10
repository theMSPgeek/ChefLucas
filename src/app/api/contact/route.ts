import { postToGhl } from "@/lib/ghl";
import { handleContactEnquiry } from "@/lib/public-enquiry";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return handleContactEnquiry(request, (payload) => postToGhl(payload));
}
