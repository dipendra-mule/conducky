const { IncidentService } = require('../../dist/src/services/incident.service');
const { CommentService } = require('../../dist/src/services/comment.service');
const { encryptField, decryptField, isEncrypted } = require('../../dist/src/utils/encryption');

// Mock Prisma
const mockPrisma = {
  incident: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  incidentComment: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  event: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

// Mock unified RBAC service
const mockUnifiedRBAC = {
  hasEventRole: jest.fn(),
  getUserRoles: jest.fn(),
  getAllUserRoles: jest.fn(),
};

describe('Phase 1 Encryption - Incident and Comment Services', () => {
  const originalEnv = process.env.ENCRYPTION_KEY;
  let incidentService;
  let commentService;

  beforeAll(() => {
    // Set a test encryption key
    process.env.ENCRYPTION_KEY = 'test-encryption-key-for-conducky-testing-phase1';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    incidentService = new IncidentService(mockPrisma);
    incidentService.unifiedRBAC = mockUnifiedRBAC;
    commentService = new CommentService(mockPrisma);
  });

  afterAll(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  describe('IncidentService Encryption', () => {
    describe('createIncident', () => {
      it('should encrypt sensitive incident fields during creation', async () => {
        const testIncidentData = {
          eventId: 'test-event-id',
          reporterId: 'test-reporter-id',
          type: 'harassment',
          title: 'Test incident title',
          description: 'Sensitive incident description that should be encrypted',
          parties: 'Person A and Person B were involved',
          location: 'Conference room 123',
          contactPreference: 'email',
          urgency: 'high'
        };

        const mockEvent = { id: 'test-event-id', name: 'Test Event' };
        const mockCreatedIncident = {
          id: 'test-incident-id',
          ...testIncidentData,
          description: 'encrypted-description-data',
          parties: 'encrypted-parties-data',
          location: 'encrypted-location-data',
          severity: 'high',
          state: 'submitted'
        };

        mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
        mockPrisma.incident.create.mockResolvedValue(mockCreatedIncident);

        const result = await incidentService.createIncident(testIncidentData);

        expect(result.success).toBe(true);
        
        // Verify that the create call used encrypted data
        const createCall = mockPrisma.incident.create.mock.calls[0];
        const createData = createCall[0].data;
        
        // The description, parties, and location should be encrypted
        expect(isEncrypted(createData.description)).toBe(true);
        expect(isEncrypted(createData.parties)).toBe(true);
        expect(isEncrypted(createData.location)).toBe(true);
        
        // Other fields should not be encrypted
        expect(createData.title).toBe(testIncidentData.title);
        expect(createData.eventId).toBe(testIncidentData.eventId);
        expect(createData.severity).toBe(testIncidentData.urgency);
      });

      it('should handle incidents with null/undefined sensitive fields', async () => {
        const testIncidentData = {
          eventId: 'test-event-id',
          reporterId: 'test-reporter-id',
          type: 'harassment',
          title: 'Test incident title',
          description: 'Required description',
          // parties and location are undefined
          contactPreference: 'email'
        };

        const mockEvent = { id: 'test-event-id', name: 'Test Event' };
        const mockCreatedIncident = {
          id: 'test-incident-id',
          ...testIncidentData,
          state: 'submitted'
        };

        mockPrisma.event.findUnique.mockResolvedValue(mockEvent);
        mockPrisma.incident.create.mockResolvedValue(mockCreatedIncident);

        const result = await incidentService.createIncident(testIncidentData);

        expect(result.success).toBe(true);
        
        const createCall = mockPrisma.incident.create.mock.calls[0];
        const createData = createCall[0].data;
        
        // Description should be encrypted
        expect(isEncrypted(createData.description)).toBe(true);
        // Undefined fields should not cause encryption
        expect(createData.parties).toBeUndefined();
        expect(createData.location).toBeUndefined();
      });
    });

    describe('getIncidentById', () => {
      it('should decrypt incident data when retrieving by ID', async () => {
        const mockEncryptedIncident = {
          id: 'test-incident-id',
          title: 'Test incident',
          description: encryptField('Sensitive description'),
          parties: encryptField('Person A, Person B'),
          location: encryptField('Room 123'),
          eventId: 'test-event-id',
          state: 'submitted',
          type: 'harassment',
          severity: 'medium',
          reporterId: 'reporter-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          reporter: { id: 'reporter-id', name: 'Reporter Name', email: 'reporter@test.com' },
          assignedResponder: null,
          evidenceFiles: []
        };

        mockPrisma.incident.findUnique.mockResolvedValue(mockEncryptedIncident);
        mockUnifiedRBAC.hasEventRole.mockResolvedValue(true);

        const result = await incidentService.getIncidentById('test-incident-id');

        // Debug output
        if (!result.success) {
          console.log('Test debug - getIncidentById failed:', result.error);
        }

        expect(result.success).toBe(true);
        
        const returnedIncident = result.data.incident;
        
        // Verify fields are decrypted
        expect(returnedIncident.description).toBe('Sensitive description');
        expect(returnedIncident.parties).toBe('Person A, Person B');
        expect(returnedIncident.location).toBe('Room 123');
        
        // Non-encrypted fields should remain unchanged
        expect(returnedIncident.title).toBe('Test incident');
        expect(returnedIncident.state).toBe('submitted');
      });

      it('should handle incidents with mixed encrypted and non-encrypted fields', async () => {
        const mockIncident = {
          id: 'test-incident-id',
          title: 'Test incident',
          description: encryptField('Encrypted description'),
          parties: 'Not encrypted parties', // Not encrypted
          location: encryptField('Encrypted location'),
          eventId: 'test-event-id',
          state: 'submitted',
          type: 'harassment',
          severity: 'medium',
          reporterId: 'reporter-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          reporter: { id: 'reporter-id', name: 'Reporter Name', email: 'reporter@test.com' },
          assignedResponder: null,
          evidenceFiles: []
        };

        mockPrisma.incident.findUnique.mockResolvedValue(mockIncident);
        mockUnifiedRBAC.hasEventRole.mockResolvedValue(true);

        const result = await incidentService.getIncidentById('test-incident-id', 'test-event-id');

        expect(result.success).toBe(true);
        
        const returnedIncident = result.data.incident;
        
        // Encrypted fields should be decrypted
        expect(returnedIncident.description).toBe('Encrypted description');
        expect(returnedIncident.location).toBe('Encrypted location');
        
        // Non-encrypted field should remain as-is
        expect(returnedIncident.parties).toBe('Not encrypted parties');
      });
    });

    describe('updateIncidentParties', () => {
      it('should encrypt parties data when updating', async () => {
        const mockIncident = {
          id: 'test-incident-id',
          eventId: 'test-event-id',
          parties: 'old-parties',
          title: 'Test incident',
          description: 'Test description',
          state: 'submitted',
          type: 'harassment',
          severity: 'medium',
          reporterId: 'reporter-id',
          createdAt: new Date(),
          updatedAt: new Date(),
          reporter: { id: 'reporter-id', name: 'Reporter Name', email: 'reporter@test.com' }
        };

        const mockUpdatedIncident = {
          ...mockIncident,
          parties: 'encrypted-new-parties-data'
        };

        mockPrisma.incident.findUnique.mockResolvedValue(mockIncident);
        mockPrisma.incident.update.mockResolvedValue(mockUpdatedIncident);
        mockUnifiedRBAC.hasEventRole.mockResolvedValue(true);

        const result = await incidentService.updateIncidentParties(
          'test-event-id', 
          'test-incident-id', 
          'New parties involved', 
          'test-user-id'
        );

        expect(result.success).toBe(true);
        
        // Verify update call used encrypted data
        const updateCall = mockPrisma.incident.update.mock.calls[0];
        const updateData = updateCall[0].data;
        
        expect(isEncrypted(updateData.parties)).toBe(true);
        
        // Verify decrypted data is returned (mocked as encrypted in this test)
        // In real scenario, the decryptIncidentData method would handle this
        expect(result.data.incident.parties).toBeDefined();
      });
    });
  });

  describe('CommentService Encryption', () => {
    describe('createComment', () => {
      it('should encrypt comment body during creation', async () => {
        const testCommentData = {
          incidentId: 'test-incident-id',
          authorId: 'test-author-id',
          body: 'This is a sensitive comment that should be encrypted',
          visibility: 'public',
          isMarkdown: false
        };

        const mockIncident = {
          id: 'test-incident-id',
          eventId: 'test-event-id',
          event: { id: 'test-event-id' }
        };

        const mockCreatedComment = {
          id: 'test-comment-id',
          ...testCommentData,
          body: 'encrypted-comment-body',
          createdAt: new Date(),
          updatedAt: new Date(),
          author: { id: 'test-author-id', name: 'Author Name', email: 'author@test.com' }
        };

        mockPrisma.incident.findUnique.mockResolvedValue(mockIncident);
        mockPrisma.incidentComment.create.mockResolvedValue(mockCreatedComment);

        const result = await commentService.createComment(testCommentData);

        expect(result.success).toBe(true);
        
        // Verify that the create call used encrypted data
        const createCall = mockPrisma.incidentComment.create.mock.calls[0];
        const createData = createCall[0].data;
        
        expect(isEncrypted(createData.body)).toBe(true);
        
        // Verify other fields are not encrypted
        expect(createData.incidentId).toBe(testCommentData.incidentId);
        expect(createData.authorId).toBe(testCommentData.authorId);
        expect(createData.visibility).toBe(testCommentData.visibility);
      });
    });

    describe('getIncidentComments', () => {
      it('should decrypt comment bodies when retrieving comments', async () => {
        const mockEncryptedComments = [
          {
            id: 'comment-1',
            incidentId: 'test-incident-id',
            body: encryptField('First encrypted comment'),
            visibility: 'public',
            createdAt: new Date(),
            author: { id: 'author-1', name: 'Author 1', email: 'author1@test.com' }
          },
          {
            id: 'comment-2',
            incidentId: 'test-incident-id',
            body: encryptField('Second encrypted comment'),
            visibility: 'internal',
            createdAt: new Date(),
            author: { id: 'author-2', name: 'Author 2', email: 'author2@test.com' }
          }
        ];

        mockPrisma.incidentComment.count.mockResolvedValue(2);
        mockPrisma.incidentComment.findMany.mockResolvedValue(mockEncryptedComments);

        const result = await commentService.getIncidentComments('test-incident-id', {});

        expect(result.success).toBe(true);
        
        const returnedComments = result.data.comments;
        
        // Verify comments are decrypted
        expect(returnedComments[0].body).toBe('First encrypted comment');
        expect(returnedComments[1].body).toBe('Second encrypted comment');
        
        // Verify other fields remain unchanged
        expect(returnedComments[0].visibility).toBe('public');
        expect(returnedComments[1].visibility).toBe('internal');
      });
    });

    describe('updateComment', () => {
      it('should encrypt updated comment body', async () => {
        const mockExistingComment = {
          id: 'test-comment-id',
          incidentId: 'test-incident-id',
          authorId: 'test-author-id',
          body: 'old-encrypted-body',
          incident: {
            eventId: 'test-event-id',
            event: { id: 'test-event-id' }
          }
        };

        const mockUpdatedComment = {
          ...mockExistingComment,
          body: 'new-encrypted-body',
          author: { id: 'test-author-id', name: 'Author', email: 'author@test.com' }
        };

        mockPrisma.incidentComment.findUnique.mockResolvedValue(mockExistingComment);
        mockPrisma.incidentComment.update.mockResolvedValue(mockUpdatedComment);

        const updateData = {
          body: 'Updated comment text',
          visibility: 'public'
        };

        const result = await commentService.updateComment(
          'test-comment-id',
          updateData,
          'test-author-id'
        );

        expect(result.success).toBe(true);
        
        // Verify update call used encrypted data
        const updateCall = mockPrisma.incidentComment.update.mock.calls[0];
        const updateCallData = updateCall[0].data;
        
        expect(isEncrypted(updateCallData.body)).toBe(true);
        expect(updateCallData.visibility).toBe('public');
      });
    });
  });

  describe('Encryption Integration', () => {
    it('should maintain encryption consistency across incident operations', async () => {
      const originalText = 'Very sensitive incident information';
      const encrypted = encryptField(originalText);
      const decrypted = decryptField(encrypted);
      
      expect(isEncrypted(encrypted)).toBe(true);
      expect(decrypted).toBe(originalText);
      expect(encrypted).not.toBe(originalText);
    });

    it('should handle encryption errors gracefully in services', () => {
      // Test that service methods don't throw when encryption fails
      // This is important for backward compatibility
      expect(() => {
        incidentService.decryptIncidentData({
          id: 'test',
          description: 'invalid-encrypted-format',
          parties: null,
          location: undefined
        });
      }).not.toThrow();
    });
  });
}); 