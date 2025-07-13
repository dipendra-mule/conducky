/* global jest, describe, it, expect */
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import IncidentDetailView from './IncidentDetailView';
import { RelatedFileSection } from './incident-detail/RelatedFileSection';

// Mock Card, Table, Button, Avatar for isolation
jest.mock("./ui/card", () => ({
  __esModule: true,
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <div data-testid="card" {...props}>{children}</div>,
}));
jest.mock("./Table", () => ({
  __esModule: true,
  Table: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <table data-testid="table" {...props}>{children}</table>,
}));
jest.mock("@/components/ui/button", () => ({
  __esModule: true,
  Button: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => <button {...props}>{children}</button>,
}));

describe("IncidentDetailView", () => {
  const baseReport = {
    id: "r1",
    description: "Test report",
    state: "submitted",
    reporter: { id: "u1", name: "Alice", email: "alice@example.com" },
  };
  const user = { id: "u2", name: "Bob", email: "bob@example.com", roles: ["responder"] };
  const userRoles = ["responder"];
  const relatedFiles = [
    { id: "e1", filename: "file1.txt", uploader: { id: "u2", name: "Bob" } },
  ];
  const eventUsers = [
    { id: "u2", name: "Bob" },
    { id: "u3", name: "Carol" },
  ];

  it("renders report details", () => {
    render(
      <IncidentDetailView
        incident={{ ...baseReport, title: "Test Title", reporterId: "u1" }}
        user={{ id: "u1", name: "Alice", roles: [] }}
        userRoles={[]}
      />
    );
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test report")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows state dropdown for allowed user", () => {
    const onStateChange = jest.fn();
    render(
      <IncidentDetailView
        incident={baseReport}
        user={user}
        userRoles={userRoles}
        onStateChange={onStateChange}
      />
    );
    fireEvent.click(screen.getByLabelText('Edit state'));
    const select = screen.getByDisplayValue("submitted");
    expect(select).toBeInTheDocument();
    fireEvent.change(select, { target: { value: "acknowledged" } });
    expect(onStateChange).toHaveBeenCalled();
  });

  it("shows admin fields in adminMode", () => {
    const setAssignmentFields = jest.fn();
    render(
      <IncidentDetailView
        incident={baseReport}
        user={user}
        userRoles={["event_admin"]}
        adminMode={true}
        assignmentFields={{ assignedResponderId: "u2", severity: "high", resolution: "done" }}
        setAssignmentFields={setAssignmentFields}
        eventUsers={eventUsers}
      />
    );
    fireEvent.click(screen.getByLabelText('Edit assigned responder'));
    expect(screen.getByRole('option', { name: 'Bob' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Carol' })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Edit severity'));
    expect((screen.getByRole('option', { name: 'High' }) as HTMLOptionElement).selected).toBe(true);
    fireEvent.click(screen.getByLabelText('Edit resolution'));
    expect(screen.getByDisplayValue('done')).toBeInTheDocument();
  });

  it("shows evidence and allows delete for responder", async () => {
    const onRelatedFileDelete = jest.fn();
    const relatedFiles = [
      { id: "e1", filename: "file1.txt", mimetype: "text/plain", size: 123, uploader: { id: "u2", name: "Bob" } },
    ];
    function Wrapper() {
      // Set deletingRelatedFileId to the file's ID so Confirm is rendered immediately
      return (
        <RelatedFileSection
          relatedFiles={relatedFiles}
          apiBaseUrl="http://localhost:4000"
          incident={{ id: "r1" }}
          isResponderOrAbove={true}
          deletingRelatedFileId={relatedFiles[0].id}
          setDeletingRelatedFileId={() => {}}
          onRelatedFileDelete={onRelatedFileDelete}
          newRelatedFiles={[]}
          setNewRelatedFiles={() => {}}
        />
      );
    }
    render(<Wrapper />);
    expect(screen.getByText("file1.txt")).toBeInTheDocument();
    // Wait for the confirm button to appear and click it
    const confirmButton = await screen.findByRole('button', { name: /confirm/i });
    fireEvent.click(confirmButton);
    expect(onRelatedFileDelete).toHaveBeenCalled();
  });

  // TODO: Update these tests for the new CommentsSection architecture
  // The comments are now fetched internally in CommentsSection and require eventSlug
  /*
  it("shows comments and allows edit/delete for author", () => {
    const onCommentEdit = jest.fn();
    const onCommentDelete = jest.fn();
    render(
      <IncidentDetailView
        report={baseReport}
        user={user}
        userRoles={userRoles}
        eventSlug="test-event"
        comments={comments}
        onCommentEdit={onCommentEdit}
        onCommentDelete={onCommentDelete}
      />
    );
    expect(screen.getByText("A comment")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Edit"));
    fireEvent.change(screen.getByDisplayValue("A comment"), { target: { value: "Edited" } });
    fireEvent.click(screen.getByText("Save"));
    expect(onCommentEdit).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Delete"));
    expect(onCommentDelete).toHaveBeenCalled();
  });

  it("shows add comment form and calls onCommentSubmit", () => {
    const onCommentSubmit = jest.fn();
    render(
      <IncidentDetailView
        report={baseReport}
        user={user}
        userRoles={userRoles}
        eventSlug="test-event"
        onCommentSubmit={onCommentSubmit}
      />
    );
    fireEvent.change(screen.getByPlaceholderText("Write your comment..."), { target: { value: "New comment" } });
    fireEvent.click(screen.getByText("Add Comment"));
    expect(onCommentSubmit).toHaveBeenCalledWith("New comment", "public");
  });
  */

  it("renders evidence file download link with correct apiBaseUrl", () => {
    const apiBaseUrl = "https://api.example.com";
    render(
      <IncidentDetailView
        incident={baseReport}
        user={user}
        userRoles={userRoles}
        relatedFiles={relatedFiles}
        apiBaseUrl={apiBaseUrl}
      />
    );
    
    // Look for download link - it might be a separate button/link from the filename text
    const downloadLinks = screen.getAllByRole('link');
    expect(downloadLinks.length).toBeGreaterThan(0);
    
    // Find the download link (should contain the evidence file ID)
    const downloadLink = downloadLinks.find(link => 
      link.getAttribute('href')?.includes(relatedFiles[0].id)
    );
    expect(downloadLink).toBeTruthy();
    expect(downloadLink).toHaveAttribute(
      "href",
      `${apiBaseUrl}/api/evidence/${relatedFiles[0].id}/download`
    );
  });

  it("shows evidence upload form for the reporter", () => {
    const reporterUser = { id: "u1", name: "Alice", email: "alice@example.com", roles: [] };
    render(
      <IncidentDetailView
        incident={{ ...baseReport, reporterId: "u1" }}
        user={reporterUser}
        userRoles={[]}
        relatedFiles={relatedFiles}
        onEvidenceUpload={jest.fn()}
      />
    );
    expect(screen.getByLabelText(/file/i)).toBeInTheDocument();
    expect(screen.getByText('Upload Related Files')).toBeInTheDocument();
  });

  it("shows the report title as the heading", () => {
    render(
      <IncidentDetailView
        incident={{ ...baseReport, title: "Test Title", reporterId: "u1" }}
        user={{ id: "u1", name: "Alice", roles: [] }}
        userRoles={[]}
      />
    );
    expect(screen.getByRole("heading", { name: /Test Title/ })).toBeInTheDocument();
  });

  it("shows edit button for reporter", () => {
    render(
      <IncidentDetailView
        incident={{ ...baseReport, title: "Test Title", reporterId: "u1" }}
        user={{ id: "u1", name: "Alice", roles: [] }}
        userRoles={[]}
      />
    );
    expect(screen.getByLabelText('Edit title')).toBeInTheDocument();
  });

  it("shows edit button for admin", () => {
    render(
      <IncidentDetailView
        incident={{ ...baseReport, title: "Test Title", reporterId: "u2" }}
        user={{ id: "admin", name: "Admin", roles: ["event_admin"] }}
        userRoles={["event_admin"]}
      />
    );
    expect(screen.getByLabelText('Edit title')).toBeInTheDocument();
  });

  it("allows editing the title and validates length", async () => {
    const onTitleEdit = jest.fn(() => Promise.resolve());
    render(
      <IncidentDetailView
        incident={{ ...baseReport, title: "Test Title", reporterId: "u1" }}
        user={{ id: "u1", name: "Alice", roles: [] }}
        userRoles={[]}
        onTitleEdit={onTitleEdit}
      />
    );
    fireEvent.click(screen.getByLabelText('Edit title'));
    const input = screen.getByPlaceholderText("Incident Title");
    fireEvent.change(input, { target: { value: "short" } });
    fireEvent.click(screen.getByText("Save"));
    expect(await screen.findByText(/between 10 and 70/)).toBeInTheDocument();
    fireEvent.change(input, { target: { value: "A valid new title" } });
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(onTitleEdit).toHaveBeenCalledWith("A valid new title"));
  });
}); 