"use client";

import { ErrorProvider } from "./_context/ErrorContext";
import { MenuProvider } from "./_context/MenuContext";
import { UserProvider } from "./_context/UserContext";
import DashboardApp from "../../components/dashboard/dashboard-app";

export default function DashboardPage() {
  return (
    <ErrorProvider>
      <UserProvider>
        <MenuProvider>
          <DashboardApp />
        </MenuProvider>
      </UserProvider>
    </ErrorProvider>
  );
}
