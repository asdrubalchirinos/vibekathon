import { signOut } from "@/lib/actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button type="submit" className="btn btn-ghost">
        Salir
      </button>
    </form>
  );
}
