import type { CollectionBeforeChangeHook } from "payload";

/**
 * Stamps `fieldName` with the acting user's id on create only, never
 * touching it again on later edits. Same pattern Campaigns.ts's
 * `setCreatedBy` already used inline — pulled out here so Media.ts's
 * `uploadedBy` (RFP feedback C3) can share it instead of duplicating it.
 */
export function setOwnerOnCreate(fieldName: string): CollectionBeforeChangeHook {
  return ({ data, operation, req }) => {
    if (operation === "create" && req.user?.id) {
      data[fieldName] = req.user.id;
    }
    return data;
  };
}
