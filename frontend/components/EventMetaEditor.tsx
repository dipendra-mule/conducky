import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PencilIcon, CheckIcon, XMarkIcon, LinkIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { SecureMarkdown } from "@/components/ui/secure-markdown";
import { isValidEmail } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface EventMeta {
  name: string;
  logo?: string;
  startDate?: string;
  endDate?: string;
  website?: string;
  contactEmail?: string;
  description?: string;
  codeOfConduct?: string;
}

interface EventMetaEditorProps {
  event: EventMeta;
  eventSlug: string;
  onMetaChange: (field: keyof EventMeta, value: string | File | null) => void;
  onMetaSave: (field: keyof EventMeta, value: string | File | null) => Promise<void>;
  metaEditError?: string;
  metaEditSuccess?: string;
  logoExists?: boolean;
  logoPreview?: string | null;
  logoUploadLoading?: boolean;
}

export function EventMetaEditor({
  event,
  eventSlug,
  onMetaChange,
  onMetaSave,
  metaEditError,
  metaEditSuccess,
  logoExists,
  logoPreview,
  logoUploadLoading,
}: EventMetaEditorProps) {
  const [editingField, setEditingField] = useState<keyof EventMeta | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [showCodeSheet, setShowCodeSheet] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const backendBaseUrl = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) || "http://localhost:4000";
  const logoSrc = logoPreview || (logoExists ? `${backendBaseUrl}/api/events/slug/${eventSlug}/logo` : null);

  const startEdit = (field: keyof EventMeta, value: string) => {
    setEditingField(field);
    setEditValue(value || "");
    if (field === "logo") setLogoFile(null);
    setEmailError(null);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
    setLogoFile(null);
    setEmailError(null);
  };

  const saveEdit = async () => {
    if (!editingField) return;
    
    // Validate email before saving
    if (editingField === "contactEmail" && editValue && !isValidEmail(editValue)) {
      setEmailError("Please enter a valid email address");
      return;
    }
    
    if (editingField === "logo" && logoFile) {
      await onMetaSave("logo", logoFile);
    } else {
      await onMetaSave(editingField, editValue);
    }
    setEditingField(null);
    setEditValue("");
    setLogoFile(null);
    setEmailError(null);
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    if (file) {
      onMetaChange("logo", file);
    }
  };

  const copyCodeOfConductLink = async () => {
    const url = `${window.location.origin}/event/${eventSlug}/code-of-conduct`;
    try {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const openCodeOfConductPage = () => {
    const url = `/event/${eventSlug}/code-of-conduct`;
    window.open(url, '_blank');
  };

  const renderEditableField = (
    field: keyof EventMeta,
    label: string,
    type: 'text' | 'date' | 'email' | 'url' | 'textarea' | 'logo' | 'code' = 'text',
    placeholder?: string
  ) => {
    const isEditing = editingField === field;
    const value = event[field] || "";

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</Label>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => startEdit(field, value as string)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            {type === 'logo' && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Upload image file</Label>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoFileChange}
                    className="cursor-pointer"
                  />
                </div>
                <div className="text-center text-xs text-muted-foreground">or</div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Image URL</Label>
                  <Input 
                    value={editValue} 
                    onChange={e => setEditValue(e.target.value)} 
                    placeholder="https://example.com/logo.png" 
                    disabled={!!logoFile}
                    className="w-full"
                  />
                </div>
              </div>
            )}
            {type === 'textarea' && (
              <Textarea 
                value={editValue} 
                onChange={e => setEditValue(e.target.value)} 
                placeholder={placeholder}
                className="min-h-[80px] resize-none"
              />
            )}
            {type === 'code' && (
              <Textarea 
                value={editValue} 
                onChange={e => setEditValue(e.target.value)} 
                placeholder={placeholder || "Enter code of conduct in markdown..."}
                className="min-h-[120px] font-mono text-sm resize-none"
              />
            )}
            {type === 'email' && (
              <div className="space-y-2">
                <Input 
                  type="email" 
                  value={editValue} 
                  onChange={e => {
                    const value = e.target.value;
                    setEditValue(value);
                    if (value && !isValidEmail(value)) {
                      setEmailError("Please enter a valid email address");
                    } else {
                      setEmailError(null);
                    }
                  }} 
                  placeholder={placeholder || "contact@example.com"}
                  className={emailError ? 'border-destructive focus:border-destructive' : ''}
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
              </div>
            )}
            {!['logo', 'textarea', 'code', 'email'].includes(type) && (
              <Input 
                type={type}
                value={editValue} 
                onChange={e => setEditValue(e.target.value)} 
                placeholder={placeholder}
                className="w-full"
              />
            )}
            
            <div className="flex items-center gap-2 pt-1">
              <Button 
                onClick={saveEdit} 
                size="sm" 
                disabled={logoUploadLoading || !!emailError}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button 
                onClick={cancelEdit} 
                variant="outline" 
                size="sm"
                disabled={logoUploadLoading}
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              {logoUploadLoading && <span className="text-xs text-muted-foreground">Uploading...</span>}
            </div>
          </div>
        ) : (
          <div className="min-h-[40px] flex items-center">
            {field === 'logo' ? (
              <div className="flex items-center gap-4">
                {logoSrc && (
                  <img 
                    src={logoSrc} 
                    alt="Event Logo" 
                    className="w-16 h-16 object-contain rounded-md bg-background border border-border shadow-sm" 
                  />
                )}
                <div className="text-sm text-muted-foreground">
                  {value || <span className="italic">No logo uploaded</span>}
                </div>
              </div>
            ) : field === 'codeOfConduct' ? (
              <div className="flex items-center gap-2">
                {value ? (
                  <Sheet open={showCodeSheet} onOpenChange={setShowCodeSheet}>
                    <SheetTrigger asChild>
                      <Button variant="link" className="p-0 h-auto text-primary font-medium">
                        View Code of Conduct
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-2xl">
                      <SheetHeader className="space-y-4">
                        <SheetTitle>Code of Conduct</SheetTitle>
                        <div className="flex gap-2">
                          <Button 
                            onClick={copyCodeOfConductLink}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <LinkIcon className="h-4 w-4" />
                            Copy Link
                          </Button>
                          <Button 
                            onClick={openCodeOfConductPage}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                            Open Page
                          </Button>
                        </div>
                      </SheetHeader>
                      <div className="mt-6 prose dark:prose-invert max-h-[70vh] overflow-y-auto">
                        <SecureMarkdown content={value || "No code of conduct provided for this event."} type="event" />
                      </div>
                    </SheetContent>
                  </Sheet>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No code of conduct added</span>
                )}
              </div>
            ) : field === 'startDate' || field === 'endDate' ? (
              <span className="text-sm text-foreground">
                {value ? new Date(value).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : <span className="italic text-muted-foreground">Not set</span>}
              </span>
            ) : (
              <span className="text-sm text-foreground">
                {value || <span className="italic text-muted-foreground">Not set</span>}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Event Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderEditableField("name", "Event Name", "text", "Enter event name")}
        {renderEditableField("logo", "Event Logo", "logo")}
        {renderEditableField("startDate", "Start Date", "date")}
        {renderEditableField("endDate", "End Date", "date")}
        {renderEditableField("website", "Website", "url", "https://example.com")}
        {renderEditableField("contactEmail", "Contact Email", "email", "contact@example.com")}
        {renderEditableField("description", "Description", "textarea", "Enter a brief description of the event")}
        {renderEditableField("codeOfConduct", "Code of Conduct", "code", "Enter code of conduct in markdown format")}
        
        {/* Success/Error messages */}
        {(metaEditSuccess || metaEditError) && (
          <div className="space-y-2">
            {metaEditSuccess && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <AlertDescription className="text-green-800 dark:text-green-200">
                  {metaEditSuccess}
                </AlertDescription>
              </Alert>
            )}
            {metaEditError && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertDescription className="text-destructive">
                  {metaEditError}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EventMetaEditor; 