import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  AdminSettingsPage,
  AdminSettingsForm,
  MOCK_SETTINGS,
} from "./AdminSettingsPage";

// ── fetch stubs ───────────────────────────────────────────────────────────────

function stubGet(data: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(data) }),
  );
}

function stubGetThenPut(getData: unknown, putData: unknown) {
  const fetchMock = vi
    .fn()
    // First call: GET
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(getData),
    })
    // Second call: PUT
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(putData),
    });
  vi.stubGlobal("fetch", fetchMock);
}

function stubGetThenPutError(getData: unknown) {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(getData),
    })
    .mockResolvedValueOnce({ ok: false, status: 500 });
  vi.stubGlobal("fetch", fetchMock);
}

function stubGetError() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: false, status: 403 }),
  );
}

const noop = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

// ── AdminSettingsPage (with hook) ─────────────────────────────────────────────

describe("AdminSettingsPage", () => {
  it("shows loading skeletons initially", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<AdminSettingsPage />);
    expect(screen.getByLabelText("Loading settings")).toBeInTheDocument();
  });

  it("renders form fields once settings are loaded", async () => {
    stubGet(MOCK_SETTINGS);
    render(<AdminSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText("Currency emoji")).toBeInTheDocument();
      expect(
        screen.getByLabelText("Currency name (singular)"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Currency name (plural)"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Daily allowance")).toBeInTheDocument();
    });
  });

  it("populates fields with loaded values", async () => {
    stubGet(MOCK_SETTINGS);
    render(<AdminSettingsPage />);

    await waitFor(() => {
      expect(screen.getByLabelText<HTMLInputElement>("Currency emoji").value).toBe("⚡");
      expect(screen.getByLabelText<HTMLInputElement>("Daily allowance").value).toBe("5");
    });
  });

  it("shows error alert when GET fails", async () => {
    stubGetError();
    render(<AdminSettingsPage />);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/failed to load settings/i)).toBeInTheDocument();
    });
  });

  it("shows success message after save", async () => {
    stubGetThenPut(MOCK_SETTINGS, MOCK_SETTINGS);
    const user = userEvent.setup();
    render(<AdminSettingsPage />);

    // Wait for form to be ready
    await waitFor(() =>
      expect(screen.getByLabelText("Currency emoji")).toBeInTheDocument(),
    );

    // Make a change so the Save button is enabled
    await user.clear(screen.getByLabelText("Currency emoji"));
    await user.type(screen.getByLabelText("Currency emoji"), "🌮");

    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.getByText(/settings saved successfully/i)).toBeInTheDocument();
    });
  });

  it("shows error alert when PUT fails", async () => {
    stubGetThenPutError(MOCK_SETTINGS);
    const user = userEvent.setup();
    render(<AdminSettingsPage />);

    await waitFor(() =>
      expect(screen.getByLabelText("Currency emoji")).toBeInTheDocument(),
    );

    await user.clear(screen.getByLabelText("Currency emoji"));
    await user.type(screen.getByLabelText("Currency emoji"), "🌮");
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });
  });
});

// ── AdminSettingsForm (validation, isolated) ──────────────────────────────────

describe("AdminSettingsForm – validation", () => {
  function renderForm(overrides: Partial<typeof MOCK_SETTINGS> = {}) {
    const initialValues = { ...MOCK_SETTINGS, ...overrides };
    return render(
      <AdminSettingsForm
        initialValues={initialValues}
        saveState={{ status: "idle" }}
        onSubmit={noop}
      />,
    );
  }

  it("save button is disabled when form is pristine", () => {
    renderForm();
    expect(
      screen.getByRole("button", { name: /save settings/i }),
    ).toBeDisabled();
  });

  it("save button is enabled after a change", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(screen.getByLabelText("Currency emoji"));
    await user.type(screen.getByLabelText("Currency emoji"), "🌮");
    expect(
      screen.getByRole("button", { name: /save settings/i }),
    ).toBeEnabled();
  });

  it("shows error when emoji is cleared and form submitted", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(screen.getByLabelText("Currency emoji"));
    // type then delete to mark as dirty
    await user.type(screen.getByLabelText("Currency emoji"), " ");
    await user.clear(screen.getByLabelText("Currency emoji"));
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    expect(screen.getByText(/emoji is required/i)).toBeInTheDocument();
    expect(noop).not.toHaveBeenCalled();
  });

  it("shows error when singular name is empty", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(screen.getByLabelText("Currency name (singular)"));
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    expect(screen.getByText(/singular name is required/i)).toBeInTheDocument();
  });

  it("shows error when plural name is empty", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(screen.getByLabelText("Currency name (plural)"));
    await user.click(screen.getByRole("button", { name: /save settings/i }));
    expect(screen.getByText(/plural name is required/i)).toBeInTheDocument();
  });

  it("shows error when daily allowance is 0", async () => {
    renderForm();
    // Use fireEvent for number input (userEvent has quirks with type=number)
    fireEvent.change(screen.getByLabelText("Daily allowance"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save settings/i }));
    expect(
      screen.getByText(/must be a whole number greater than 0/i),
    ).toBeInTheDocument();
  });

  it("calls onSubmit with correct values when form is valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn<(s: typeof MOCK_SETTINGS) => Promise<void>>()
      .mockResolvedValue(undefined);
    render(
      <AdminSettingsForm
        initialValues={MOCK_SETTINGS}
        saveState={{ status: "idle" }}
        onSubmit={onSubmit}
      />,
    );
    await user.clear(screen.getByLabelText("Currency emoji"));
    await user.type(screen.getByLabelText("Currency emoji"), "🌮");
    await user.click(screen.getByRole("button", { name: /save settings/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ emoji: "🌮" }),
    );
  });

  it("discard button resets to initial values", async () => {
    const user = userEvent.setup();
    renderForm();
    await user.clear(screen.getByLabelText("Currency emoji"));
    await user.type(screen.getByLabelText("Currency emoji"), "🌮");

    const discard = screen.getByRole("button", { name: /discard changes/i });
    await user.click(discard);

    expect(
      screen.getByLabelText<HTMLInputElement>("Currency emoji").value,
    ).toBe("⚡");
    expect(screen.queryByRole("button", { name: /discard changes/i })).toBeNull();
  });
});
