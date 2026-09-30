import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { Layout } from "./Layout";

vi.mock("../Header", () => ({ Header: () => <header>fake header</header> }));

describe("Layout", () => {
  it("renders the header and the matched child route", () => {
    render(
      <MemoryRouter initialEntries={["/child"]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/child" element={<p>child page</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText("fake header")).toBeInTheDocument();
    expect(screen.getByRole("main")).toContainElement(screen.getByText("child page"));
  });
});
