import type { ReactElement, ReactNode } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";

interface RenderOptions {
  route?: string;
}

function Providers({ children, route = "/" }: { children: ReactNode; route?: string }) {
  return (
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{children}</AuthProvider>
    </MemoryRouter>
  );
}

export function renderWithProviders(ui: ReactElement, options: RenderOptions = {}) {
  return render(ui, { wrapper: (props) => <Providers {...props} route={options.route} /> });
}

export * from "@testing-library/react";
