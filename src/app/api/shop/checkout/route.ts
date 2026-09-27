import { revalidatePath, revalidateTag } from "next/cache";
import { handleShopCheckout } from "@/lib/checkout-handler";
import { postToGhl } from "@/lib/ghl";
import { commitGhlInventory } from "@/lib/ghl-inventory-write";
import { getShopCatalogue, SHOP_CACHE_TAG } from "@/lib/ghl-products";
import { inventoryWritePermitted, readOperatorAuth } from "@/lib/shop-auth";

export const runtime = "nodejs";

function revalidateShop() {
  revalidateTag(SHOP_CACHE_TAG, "max");
  revalidatePath("/shop");
  revalidatePath("/api/shop/products");
}

export async function POST(request: Request) {
  return handleShopCheckout(request, {
    getCatalogue: () => getShopCatalogue({ fresh: true }),
    writeInventory: async (items) => {
      const { authorized } = readOperatorAuth(request);
      if (!inventoryWritePermitted(authorized)) {
        throw new Error("Inventory write blocked.");
      }
      await commitGhlInventory(items, authorized);
    },
    forwardLead: async (payload) => {
      const { authorized } = readOperatorAuth(request);
      if (!inventoryWritePermitted(authorized)) {
        return { forwarded: false, demo: true };
      }
      return postToGhl(payload);
    },
    revalidateShop,
  });
}
