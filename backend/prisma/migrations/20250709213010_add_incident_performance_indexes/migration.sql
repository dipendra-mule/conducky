-- CreateIndex
CREATE INDEX "Incident_eventId_idx" ON "Incident"("eventId");

-- CreateIndex
CREATE INDEX "Incident_reporterId_idx" ON "Incident"("reporterId");

-- CreateIndex
CREATE INDEX "Incident_assignedResponderId_idx" ON "Incident"("assignedResponderId");

-- CreateIndex
CREATE INDEX "Incident_state_idx" ON "Incident"("state");

-- CreateIndex
CREATE INDEX "Incident_severity_idx" ON "Incident"("severity");

-- CreateIndex
CREATE INDEX "Incident_createdAt_idx" ON "Incident"("createdAt");

-- CreateIndex
CREATE INDEX "Incident_updatedAt_idx" ON "Incident"("updatedAt");

-- CreateIndex
CREATE INDEX "Incident_eventId_state_idx" ON "Incident"("eventId", "state");

-- CreateIndex
CREATE INDEX "Incident_eventId_reporterId_idx" ON "Incident"("eventId", "reporterId");

-- CreateIndex
CREATE INDEX "Incident_eventId_createdAt_idx" ON "Incident"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "Incident_reporterId_state_idx" ON "Incident"("reporterId", "state");
