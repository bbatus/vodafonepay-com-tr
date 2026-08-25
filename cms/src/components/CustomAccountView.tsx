import type { PayloadRequest } from "payload";
import AccountForm from "./AccountForm";

/**
 * RFP feedback 4a-4f: registered as `admin.components.views.account.Component`
 * in payload.config.ts, replacing Payload's default Account view body
 * entirely (DocumentHeader/breadcrumbs above this are still rendered by
 * Payload's own AccountView — only the form area is ours). Doing a full
 * custom form rather than patching the default one sidesteps several
 * default behaviors at once: Payload's built-in Auth block (always renders
 * "Change password" + "Force unlock" for any auth-enabled collection, with
 * no supported way to hide just those two buttons) never mounts because we
 * don't render EditView; its built-in "Ayarlar" Settings panel (redundant
 * Dil dropdown + "Tercihleri sıfırla") never mounts because that's only
 * rendered by EditView reading `docInfo.AfterFields`, which we don't touch.
 */
export default async function CustomAccountView(props: {
  user?: PayloadRequest["user"];
  initPageResult?: { req?: PayloadRequest };
}) {
  const user = (props.user ?? props.initPageResult?.req?.user) as
    | {
        id: string | number;
        email?: string;
        username?: string;
        role?: string;
        avatar?: { url?: string } | string | null;
        preferredLocale?: string;
      }
    | undefined;

  if (!user) return null;

  return <AccountForm user={user} />;
}
