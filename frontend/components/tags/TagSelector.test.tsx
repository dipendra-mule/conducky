import React from "react";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { TagSelector, Tag } from "./TagSelector";

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

const mockTags: Tag[] = [
  { id: "1", name: "Harassment", color: "red", eventId: "event1" },
  { id: "2", name: "Safety", color: "orange", eventId: "event1" },
  { id: "3", name: "Accessibility", color: "blue", eventId: "event1" },
];

const defaultProps = {
  eventSlug: "test-event",
  selectedTags: [],
  onTagsChange: jest.fn(),
  disabled: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("TagSelector", () => {
  it("renders loading state initially", () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    
    render(<TagSelector {...defaultProps} />);
    
    expect(screen.getByText("Loading tags...")).toBeInTheDocument();
  });

  it("renders error state when fetch fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));
    
    await act(async () => {
      render(<TagSelector {...defaultProps} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText("Failed to load tags")).toBeInTheDocument();
    });
  });

  it("renders tag selector when tags are loaded", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: mockTags }),
    });
    
    await act(async () => {
      render(<TagSelector {...defaultProps} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText("Tags")).toBeInTheDocument();
      expect(screen.getByText("Add a tag...")).toBeInTheDocument();
    });
  });

  it("displays selected tags with remove buttons", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: mockTags }),
    });
    
    const selectedTags = [mockTags[0]];
    
    await act(async () => {
      render(
        <TagSelector 
          {...defaultProps} 
          selectedTags={selectedTags}
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText("Harassment")).toBeInTheDocument();
      expect(screen.getByLabelText("Remove Harassment tag")).toBeInTheDocument();
    });
  });

  it("does not show remove buttons when disabled", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: mockTags }),
    });
    
    const selectedTags = [mockTags[0]];
    
    await act(async () => {
      render(
        <TagSelector 
          {...defaultProps} 
          selectedTags={selectedTags}
          disabled={true}
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText("Harassment")).toBeInTheDocument();
      expect(screen.queryByLabelText("Remove Harassment tag")).not.toBeInTheDocument();
    });
  });

  it("calls onTagsChange when a tag is removed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: mockTags }),
    });
    
    const onTagsChange = jest.fn();
    const selectedTags = [mockTags[0], mockTags[1]];
    
    await act(async () => {
      render(
        <TagSelector 
          {...defaultProps} 
          selectedTags={selectedTags}
          onTagsChange={onTagsChange}
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText("Harassment")).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByLabelText("Remove Harassment tag"));
    
    expect(onTagsChange).toHaveBeenCalledWith([mockTags[1]]);
  });

  it("shows empty state when no tags are available", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: [] }),
    });
    
    await act(async () => {
      render(<TagSelector {...defaultProps} />);
    });
    
    await waitFor(() => {
      expect(screen.getByText("No tags available for this event. Contact an event administrator to create tags.")).toBeInTheDocument();
    });
  });

  it("shows all tags selected state", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: mockTags }),
    });
    
    await act(async () => {
      render(
        <TagSelector 
          {...defaultProps} 
          selectedTags={mockTags}
        />
      );
    });
    
    await waitFor(() => {
      expect(screen.getByText("All available tags have been selected.")).toBeInTheDocument();
    });
  });

  it("fetches tags from correct API endpoint", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ tags: mockTags }),
    });
    
    await act(async () => {
      render(<TagSelector {...defaultProps} eventSlug="my-event" />);
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      "http://localhost:4000/api/tags/event/slug/my-event",
      { credentials: 'include' }
    );
  });
}); 