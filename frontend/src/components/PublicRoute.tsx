import { Navigate } from "react-router-dom";

type Props = {
  children: React.ReactNode;
};

export default function PublicRoute({ children }: Props) {
  const token = localStorage.getItem("token");
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
