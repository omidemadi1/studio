import { Button } from '@/components/ui/button';

interface OAuthButtonProps {
  provider: 'google' | 'microsoft' | 'apple';
  disabled?: boolean;
  onClick?: () => void;
}

const providerConfig = {
  google: {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="currentColor"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="currentColor"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="currentColor"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border border-gray-300',
  },
  microsoft: {
    name: 'Microsoft',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 21 21">
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
    ),
    bgColor: 'bg-white hover:bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border border-gray-300',
  },
  apple: {
    name: 'Apple',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
      </svg>
    ),
    bgColor: 'bg-black hover:bg-gray-900',
    textColor: 'text-white',
    borderColor: 'border-0',
  },
};

export function OAuthButton({ provider, disabled, onClick }: OAuthButtonProps) {
  const config = providerConfig[provider];

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: redirect to OAuth endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      window.location.href = `${apiUrl}/api/oauth/${provider}`;
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className={`w-full ${config.bgColor} ${config.textColor} ${config.borderColor}`}
      onClick={handleClick}
      disabled={disabled}
    >
      <span className="mr-2">{config.icon}</span>
      Continue with {config.name}
    </Button>
  );
}

interface OAuthButtonGroupProps {
  disabled?: boolean;
  onProviderClick?: (provider: 'google' | 'microsoft' | 'apple') => void;
}

export function OAuthButtonGroup({ disabled, onProviderClick }: OAuthButtonGroupProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="space-y-2">
        <OAuthButton
          provider="google"
          disabled={disabled}
          onClick={onProviderClick ? () => onProviderClick('google') : undefined}
        />
        <OAuthButton
          provider="microsoft"
          disabled={disabled}
          onClick={onProviderClick ? () => onProviderClick('microsoft') : undefined}
        />
        <OAuthButton
          provider="apple"
          disabled={disabled}
          onClick={onProviderClick ? () => onProviderClick('apple') : undefined}
        />
      </div>
    </div>
  );
}
