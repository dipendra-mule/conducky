---
sidebar_position: 6
---

# Navigation Troubleshooting

This page helps you resolve common navigation issues in Conducky. Follow these troubleshooting steps to get back to productive incident management quickly.

## Common Navigation Issues

### Sidebar Not Showing

**Symptoms:**
- Navigation sidebar is completely missing
- Only the main content area is visible
- Cannot access any navigation menus

**Solutions:**

1. **Check Authentication Status**
   - Verify you're logged in (look for user menu in top-right)
   - If not logged in, go to `/login` and sign in
   - Check if your session has expired

2. **Browser-Related Fixes**
   - Refresh the page (Ctrl+F5 or Cmd+Shift+R)
   - Clear browser cache and cookies
   - Disable browser extensions temporarily
   - Try incognito/private browsing mode

3. **JavaScript Issues**
   - Ensure JavaScript is enabled in your browser
   - Check browser console for error messages (F12 → Console tab)
   - Try a different browser to isolate the issue

4. **Network Connectivity**
   - Check your internet connection
   - Try accessing other websites to verify connectivity
   - If using VPN, try disconnecting temporarily

### Missing Navigation Items

**Symptoms:**
- Some expected menu items are not visible
- Navigation seems incomplete compared to what you expect
- Cannot access features you previously could

**Solutions:**

1. **Verify Role Permissions**
   - Check your role in the current event (visible in event switcher)
   - Remember: System Admins need event roles to access event data
   - Contact event administrators if you need additional permissions

2. **Context Verification**
   - Confirm you're in the correct context (global, event, or system admin)
   - Switch to the appropriate context using navigation
   - Check breadcrumbs to understand your current location

3. **Event Status Check**
   - Verify the event is still active (not disabled)
   - Check with event administrators about event status
   - Try switching to a different event to test navigation

### Event Switcher Empty

**Symptoms:**
- "My Events" section shows no events
- Cannot switch between events
- Event switcher dropdown is empty

**Solutions:**

1. **Event Membership Verification**
   - Go to `/profile/events` to check your event memberships
   - Verify you haven't been removed from events
   - Check if you have any pending invitations to accept

2. **Event Status Issues**
   - Contact event administrators to verify event status
   - Check if events have been disabled by system administrators
   - Verify events still exist and haven't been deleted

3. **Data Loading Issues**
   - Refresh the page to reload event data
   - Clear browser cache to force fresh data load
   - Check network connectivity and try again

### Navigation Performance Issues

**Symptoms:**
- Sidebar loads slowly or appears delayed
- Navigation feels sluggish or unresponsive
- Long delays when switching between events

**Solutions:**

1. **Browser Optimization**
   - Close unnecessary browser tabs
   - Clear browser cache and restart browser
   - Update browser to latest version
   - Disable unnecessary browser extensions

2. **Network Optimization**
   - Check internet connection speed
   - Try switching to a different network
   - Disable VPN if using one
   - Contact IT support for network issues

3. **System Resources**
   - Close other applications to free up memory
   - Restart your computer if performance is generally slow
   - Check if your device meets minimum system requirements

## Role-Specific Issues

### System Admin Issues

**Problem: System admin section missing**
- Verify you have System Admin role assignment
- Check with other system administrators
- Try logging out and back in
- Contact technical support if role is confirmed

**Problem: Cannot access events despite system admin role**
- Remember: System Admins need explicit event roles
- Contact event administrators to request event access
- Use system admin interface to manage events, not access their data

**Problem: System admin navigation slow**
- Check for excessive API calls in browser developer tools
- Clear browser cache and refresh
- Try accessing during off-peak hours
- Contact technical support for performance issues

### Event Admin Issues

**Problem: Cannot access event settings**
- Verify you have Event Admin role (not just Responder)
- Check if event is disabled by system administrators
- Try refreshing the page
- Contact system administrators if issues persist

**Problem: Team management not visible**
- Confirm you're in the correct event context
- Verify your Event Admin role in this specific event
- Check if team management is disabled for this event
- Switch to event context using event switcher

### Responder Issues

**Problem: Cannot see all incidents**
- Verify you have Responder role (not just Reporter)
- Check if you're in the correct event context
- Confirm incidents exist in this event
- Try refreshing the incident list

**Problem: Team section shows "view only"**
- This is expected behavior for Responders
- Only Event Admins can manage team members
- Contact Event Admin if you need management access

### Reporter Issues

**Problem: Can only see own incidents**
- This is expected behavior for Reporters
- Reporters cannot view incidents submitted by others
- Contact event administrators if you need broader access

**Problem: Cannot submit incidents**
- Verify you're in the correct event context
- Check if incident submission is enabled for this event
- Try refreshing the page
- Contact event administrators for support

## Browser-Specific Solutions

### Chrome Issues

1. **Clear Chrome Data**
   - Go to Settings → Privacy and Security → Clear browsing data
   - Select "All time" and check all boxes
   - Click "Clear data"

2. **Disable Extensions**
   - Go to Settings → Extensions
   - Temporarily disable all extensions
   - Test navigation functionality

3. **Reset Chrome Settings**
   - Go to Settings → Advanced → Reset and clean up
   - Click "Restore settings to original defaults"

### Firefox Issues

1. **Clear Firefox Data**
   - Go to Settings → Privacy & Security
   - Click "Clear Data" under Cookies and Site Data
   - Click "Clear" under Cached Web Content

2. **Disable Add-ons**
   - Go to Add-ons and Themes
   - Disable all add-ons temporarily
   - Test navigation functionality

3. **Firefox Safe Mode**
   - Help → Troubleshooting Information
   - Click "Restart with Add-ons Disabled"

### Safari Issues

1. **Clear Safari Data**
   - Safari → Preferences → Privacy
   - Click "Manage Website Data" → "Remove All"
   - Empty Caches: Develop → Empty Caches (if Develop menu enabled)

2. **Disable Safari Extensions**
   - Safari → Preferences → Extensions
   - Uncheck all extensions temporarily

3. **Reset Safari**
   - Safari → Preferences → Privacy
   - Click "Remove All Website Data"

## Mobile Navigation Issues

### Mobile Sidebar Problems

**Problem: Cannot open sidebar on mobile**
- Try tapping the hamburger menu (☰) in top-left
- Try swiping right from the left edge of screen
- Refresh the page and try again
- Try rotating device orientation

**Problem: Sidebar doesn't close on mobile**
- Tap outside the sidebar area
- Try swiping left on the sidebar
- Tap the hamburger menu again
- Refresh the page if stuck

### Mobile Performance Issues

**Problem: Navigation is slow on mobile**
- Check mobile data/WiFi connection
- Close other mobile browser tabs
- Clear mobile browser cache
- Try using a different mobile browser

**Problem: Touch targets too small**
- Check device accessibility settings
- Try pinch-to-zoom on the page
- Use device's built-in zoom features
- Contact administrators about mobile optimization

## Getting Additional Help

### Self-Service Diagnostics

1. **Browser Console Check**
   - Press F12 to open developer tools
   - Click "Console" tab
   - Look for red error messages
   - Screenshot errors for support

2. **Network Tab Analysis**
   - In developer tools, click "Network" tab
   - Refresh the page
   - Look for failed requests (red entries)
   - Note any 403, 404, or 500 errors

3. **Application Tab Check**
   - In developer tools, click "Application" tab
   - Check Local Storage and Session Storage
   - Clear storage if corrupted data is suspected

### When to Contact Support

**Contact Event Administrators for:**
- Role and permission issues
- Event-specific access problems
- Team management questions
- Event configuration issues

**Contact System Administrators for:**
- System-wide access problems
- Account creation issues
- System performance problems
- Technical configuration issues

**Contact Technical Support for:**
- Browser compatibility issues
- Persistent technical problems
- Security-related concerns
- Data corruption issues

### Information to Provide When Seeking Help

When contacting support, include:

1. **User Information**
   - Your username/email
   - Your role(s) in affected events
   - When the issue started

2. **Technical Details**
   - Browser name and version
   - Operating system
   - Device type (desktop/mobile)
   - Error messages (screenshots helpful)

3. **Problem Description**
   - What you were trying to do
   - What happened instead
   - Steps you've already tried
   - Whether others are experiencing the same issue

4. **Browser Console Errors**
   - Screenshots of any error messages
   - Network request failures
   - JavaScript console errors

This information helps support teams diagnose and resolve issues quickly. 