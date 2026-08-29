"use client";

/**
 * Removes Payload's built-in Unpublish item from the document ⋮ menu, on every
 * collection. Overriding `admin.components.edit.UnpublishButton` with a
 * component that renders nothing is Payload's own way to drop a built-in
 * control; there is no boolean for it.
 *
 * Why, found live 29.08.2026 while adding the Checker's unpublish control:
 *
 * The ⋮ menu renders when a user has create-or-delete permission, and its
 * Unpublish item then shows whenever `hasPublishPermission` is true. Payload
 * derives that permission from collection `update` access alone and knows
 * nothing about `denyMakerEditPublished` / `guardPublishedEdit`, so a Growth
 * Maker — who has create, and therefore a ⋮ menu — was offered "Yayından
 * Kaldır" on a published document. Clicking it produced the 403 those hooks
 * exist to raise, whose message reads "Yayındaki bir kaydı düzenleyemezsiniz —
 * önce bir Checker'dan yayından kaldırmasını isteyin": the panel telling an
 * editor to ask a Checker to unpublish, in answer to them trying to unpublish.
 *
 * With this override the toolbar is the single place unpublishing lives, and
 * it is gated once, correctly, in `MakerAwarePublishButton` (and in
 * `RoleAwarePublishButton` for Campaigns, which additionally offers a Growth
 * Maker the unpublish-REQUEST its own review flow expects). The resulting
 * matrix is what the role model has always said on the server:
 *
 *   Growth Maker      — no unpublish anywhere (Campaigns: request only)
 *   Growth Checker    — unpublish in the toolbar (its ⋮ menu never renders)
 *   New Vertical      — unpublish in the toolbar
 *   Active delegate   — unpublish in the toolbar, same as a Checker
 */
export default function HideMenuUnpublishButton() {
  return null;
}
