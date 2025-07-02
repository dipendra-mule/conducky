import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import EventNavBar from "./EventNavBar";

const baseProps = {
  eventSlug: "test-event",
  eventName: "Test Event",
  user: { id: "1" },
      userRoles: ["event_admin"],
  openReportModal: jest.fn(),
};

describe("EventNavBar", () => {
  it("renders desktop nav links and button", () => {
    render(<EventNavBar {...baseProps} />);
    // Desktop nav is hidden on mobile, so force desktop
    expect(screen.getByText("Test Event")).toBeInTheDocument();
    expect(screen.getByText("Submit Incident")).toBeInTheDocument();
    expect(screen.getByText("My Incidents")).toBeInTheDocument();
    expect(screen.getByText("Event Incidents")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("opens and closes the Sheet on mobile trigger", () => {
    render(<EventNavBar {...baseProps} />);
    // Open Sheet
    const trigger = screen.getByLabelText(/open event navigation/i);
    fireEvent.click(trigger);
    // The Sheet dialog should be present
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // 'My Reports' should be present inside the dialog
    expect(within(dialog).getByText("My Incidents")).toBeInTheDocument();
    // Close Sheet
    const closeBtn = screen.getByLabelText(/close event navigation/i);
    fireEvent.click(closeBtn);
    // Sheet dialog should be removed
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it("calls openReportModal when Submit Report is clicked", () => {
    const openReportModal = jest.fn();
    render(<EventNavBar {...baseProps} openReportModal={openReportModal} />);
    fireEvent.click(screen.getAllByText("Submit Incident")[0]);
    expect(openReportModal).toHaveBeenCalled();
  });

  it("renders correct links for non-admin user", () => {
    render(<EventNavBar {...baseProps} userRoles={[]} />);
    expect(screen.getByText("My Incidents")).toBeInTheDocument();
    expect(screen.queryByText("Event Incidents")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });
}); 