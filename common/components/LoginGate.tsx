import { PasswordValidator } from "./PasswordValidator";
import { useLoginSession } from "~common/utils/useLoginSession";

export const LoginGate = ({ children }) => {
  const { cachedPassword } = useLoginSession();
  if (!cachedPassword) return (
      <PasswordValidator />
  )
  return children
}