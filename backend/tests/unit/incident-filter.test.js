const { 
  shouldShowFullDetails, 
  filterToMinimalFields, 
  filterIncidentForUser,
  filterIncidentsForUser 
} = require('../../src/utils/incident-filter');

describe('Incident Filter Utility', () => {
  const mockIncident = {
    id: 'incident-123',
    eventId: 'event-456',
    reporterId: 'user-reporter',
    title: 'Test Incident',
    description: 'Sensitive description',
    location: 'Conference room',
    state: 'open',
    severity: 'medium',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    relatedFiles: [{ id: 'file-1', filename: 'evidence.pdf' }],
    comments: [{ id: 'comment-1', content: 'Investigation notes' }]
  };

  describe('shouldShowFullDetails', () => {
    it('should return true if user is the reporter', () => {
      const result = shouldShowFullDetails('user-reporter', mockIncident, ['reporter']);
      expect(result).toBe(true);
    });

    it('should return true if user has responder role', () => {
      const result = shouldShowFullDetails('other-user', mockIncident, ['responder']);
      expect(result).toBe(true);
    });

    it('should return true if user has event_admin role', () => {
      const result = shouldShowFullDetails('other-user', mockIncident, ['event_admin']);
      expect(result).toBe(true);
    });

    it('should return true if user has system_admin role', () => {
      const result = shouldShowFullDetails('other-user', mockIncident, ['system_admin']);
      expect(result).toBe(true);
    });

    it('should return false if user has no authorized roles and is not reporter', () => {
      const result = shouldShowFullDetails('other-user', mockIncident, ['guest']);
      expect(result).toBe(false);
    });
  });

  describe('filterToMinimalFields', () => {
    it('should return only safe fields', () => {
      const result = filterToMinimalFields(mockIncident);
      
      expect(result).toEqual({
        id: 'incident-123',
        eventId: 'event-456',
        title: 'Test Incident',
        state: 'open',
        createdAt: mockIncident.createdAt,
        updatedAt: mockIncident.updatedAt
      });

      // Ensure sensitive fields are not included
      expect(result.description).toBeUndefined();
      expect(result.location).toBeUndefined();
      expect(result.reporterId).toBeUndefined();
      expect(result.relatedFiles).toBeUndefined();
      expect(result.comments).toBeUndefined();
    });
  });

  describe('filterIncidentForUser', () => {
    it('should return full incident for authorized user', () => {
      const result = filterIncidentForUser(mockIncident, 'user-reporter', ['reporter']);
      expect(result).toEqual(mockIncident);
    });

    it('should return minimal incident for unauthorized user', () => {
      const result = filterIncidentForUser(mockIncident, 'other-user', ['guest']);
      
      expect(result).toEqual({
        id: 'incident-123',
        eventId: 'event-456',
        title: 'Test Incident',
        state: 'open',
        createdAt: mockIncident.createdAt,
        updatedAt: mockIncident.updatedAt
      });
    });
  });

  describe('filterIncidentsForUser', () => {
    it('should filter an array of incidents correctly', () => {
      const incidents = [mockIncident, { ...mockIncident, id: 'incident-789' }];
      const result = filterIncidentsForUser(incidents, 'other-user', ['guest']);

      expect(result).toHaveLength(2);
      expect(result[0].description).toBeUndefined();
      expect(result[1].description).toBeUndefined();
      expect(result[0].title).toBe('Test Incident');
      expect(result[1].title).toBe('Test Incident');
    });
  });
}); 