# Sign-in Logging Implementation

This document describes the comprehensive sign-in logging system implemented for the Sandy POS application.

## Overview

The sign-in logging system tracks all user authentication attempts, both successful and failed, providing detailed analytics and security monitoring capabilities.

## Features

- ✅ **Complete Sign-in Tracking**: Records all login attempts with timestamps
- ✅ **Device Information**: Captures browser, OS, and device type
- ✅ **IP Address Logging**: Tracks user IP addresses (server-side)
- ✅ **Failure Reason Tracking**: Records why login attempts failed
- ✅ **Session Management**: Links sign-ins to session tokens
- ✅ **Admin Dashboard**: View sign-in history and statistics
- ✅ **Security Monitoring**: Track suspicious login patterns
- ✅ **User History**: Individual user sign-in history

## Database Schema

### Table: `sign_in_records`

```sql
CREATE TABLE sign_in_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  sign_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  failure_reason TEXT,
  session_id TEXT,
  device_info JSONB,
  location_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes for Performance

- `idx_sign_in_records_user_id` - Fast user lookups
- `idx_sign_in_records_email` - Fast email searches
- `idx_sign_in_records_sign_in_at` - Time-based queries
- `idx_sign_in_records_success` - Success/failure filtering

### Row Level Security (RLS)

- Users can view their own sign-in records
- Admins can view all sign-in records
- Service role can insert/update records

## Implementation Files

### Core Services

1. **`app/lib/signin-logger.ts`** - Main logging service
2. **`app/hooks/useSignInLogging.ts`** - React hook for easy integration
3. **`app/api/log-signin/route.ts`** - Server-side API for IP tracking

### Database

4. **`app/lib/signin-schema.sql`** - Database schema and policies
5. **`types/supabase.ts`** - Updated TypeScript types

### UI Components

6. **`app/components/SignInHistory.tsx`** - Sign-in history display
7. **`app/components/SignInStats.tsx`** - Statistics dashboard

### Updated Login Components

8. **`app/login/page.tsx`** - Main login page
9. **`app/ui/login-form.tsx`** - Login form component
10. **`components/CustomerLoginModal.tsx`** - Customer login modal
11. **`components/SignupModal.tsx`** - Signup modal with login

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase database:

```sql
-- Execute the contents of app/lib/signin-schema.sql
```

### 2. Environment Variables

Ensure your Supabase environment variables are properly configured:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Component Integration

The sign-in logging is automatically integrated into all existing login components. No additional setup is required.

## Usage Examples

### Basic Sign-in Logging

```typescript
import { useSignInLogging } from '@/app/hooks/useSignInLogging';

const { logSignInSuccess, logSignInFailure } = useSignInLogging();

// Log successful sign-in
await logSignInSuccess(userId, email, sessionId);

// Log failed sign-in
await logSignInFailure(userId, email, 'Invalid password');
```

### Display Sign-in History

```tsx
import SignInHistory from '@/app/components/SignInHistory';

// User's own history
<SignInHistory userId={userId} limit={20} />

// Admin view - all recent sign-ins
<SignInHistory showAll={true} limit={50} />
```

### Display Statistics

```tsx
import SignInStats from '@/app/components/SignInStats';

// Overall statistics
<SignInStats />

// Date range statistics
<SignInStats 
  startDate="2024-01-01" 
  endDate="2024-01-31" 
  title="January 2024 Sign-ins"
/>
```

### Server-side Logging (for IP tracking)

```typescript
// In API routes or server components
const response = await fetch('/api/log-signin', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId,
    email,
    success: true,
    sessionId,
    userAgent: request.headers.get('user-agent')
  })
});
```

## Data Captured

### User Information
- User ID (from Supabase Auth)
- Email address
- Session ID (access token)

### Technical Information
- IP Address (server-side detection)
- User Agent string
- Device information (browser, OS, device type)
- Timestamp of sign-in attempt

### Security Information
- Success/failure status
- Failure reason (for failed attempts)
- Location information (if available)

## Admin Dashboard Integration

### Sign-in Statistics

The `SignInStats` component provides:
- Total sign-ins count
- Successful vs failed attempts
- Success rate percentage
- Unique users count
- Date range filtering

### Sign-in History

The `SignInHistory` component displays:
- User email and ID
- Sign-in status and timestamp
- IP address and device info
- Failure reasons (if applicable)
- Pagination support

## Security Considerations

### Data Privacy
- IP addresses are stored for security monitoring
- User agents are stored for device tracking
- All data is subject to RLS policies

### Access Control
- Users can only view their own records
- Admins can view all records
- Service role required for insertions

### Data Retention
- Consider implementing data retention policies
- Archive old records if needed
- Comply with privacy regulations

## Monitoring and Alerts

### Suspicious Activity Detection
- Multiple failed attempts from same IP
- Sign-ins from unusual locations
- Unusual device patterns

### Performance Monitoring
- Database query performance
- API response times
- Error rates

## Troubleshooting

### Common Issues

1. **Sign-in records not being created**
   - Check RLS policies
   - Verify service role permissions
   - Check console for errors

2. **IP address not captured**
   - Ensure using server-side API route
   - Check proxy configuration
   - Verify headers are being passed

3. **Device info not accurate**
   - User agent parsing may need updates
   - Some browsers may not provide complete info

### Debug Mode

Enable debug logging by adding to your environment:

```env
DEBUG_SIGNIN_LOGGING=true
```

## Future Enhancements

### Planned Features
- [ ] Geographic location tracking
- [ ] Real-time notifications for suspicious activity
- [ ] Advanced analytics and reporting
- [ ] Integration with security monitoring tools
- [ ] Automated threat detection
- [ ] Sign-in pattern analysis

### Performance Optimizations
- [ ] Database query optimization
- [ ] Caching for frequently accessed data
- [ ] Background processing for analytics
- [ ] Data archiving strategies

## Support

For issues or questions regarding the sign-in logging system:

1. Check the troubleshooting section
2. Review console logs for errors
3. Verify database permissions
4. Test with debug mode enabled

## License

This implementation is part of the Sandy POS application and follows the same licensing terms.
