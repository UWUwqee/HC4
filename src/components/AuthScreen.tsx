import React, { useEffect, useState } from 'react';
import { SignIn, useSignUp } from '@clerk/react';
import { Eye, EyeOff, X } from 'lucide-react';
import centerPhoto from '../assets/images/DELFIN.png';
import { formatPhilippinePhoneNumber, isValidPhilippinePhoneNumber, normalizePhilippinePhoneNumber } from '../philippinePhone';

const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,19}$/;
const USERNAME_HINT = 'Use 3–20 lowercase letters, numbers, or underscores; start with a letter.';

const AuthField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  hint,
  autoComplete,
  required = true,
  reveal,
  minLength,
  maxLength,
  pattern,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
  reveal?: { isVisible: boolean; onToggle: () => void };
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}) => (
  <div>
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800">
      {label}
    </label>
    <div className="relative">
      <input
        id={id}
        name={id}
        type={reveal?.isVisible ? 'text' : type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        maxLength={maxLength}
        pattern={pattern}
        aria-invalid={Boolean(error)}
        aria-describedby={[hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined}
        className={`w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 ${
          reveal ? 'pr-11' : ''
        }`}
      />
      {reveal && (
        <button
          type="button"
          onClick={reveal.onToggle}
          aria-label={reveal.isVisible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={reveal.isVisible}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-500 hover:text-zinc-800"
        >
          {reveal.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
    </div>
    {hint && (
      <p id={`${id}-hint`} className="mt-1 text-xs text-zinc-600">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} className="mt-1 text-sm text-rose-600">
        {error}
      </p>
    )}
  </div>
);

const CustomSignUpForm: React.FC = () => {
  const { signUp, errors, fetchStatus } = useSignUp();
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [surname, setSurname] = useState('');
  const [suffix, setSuffix] = useState('');
  const [gender, setGender] = useState('');
  const [username, setUsername] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [requestError, setRequestError] = useState('');
  const passwordsMatch = password === confirmPassword;
  const isFetching = fetchStatus === 'fetching';

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRequestError('');

    if (!passwordsMatch) return;
    if (!USERNAME_PATTERN.test(username)) {
      setRequestError(USERNAME_HINT);
      return;
    }
    if (!isValidPhilippinePhoneNumber(contactNumber)) {
      setRequestError('Enter a valid Philippine mobile number with 10 digits after +63.');
      return;
    }

    try {
      const { error } = await signUp.password({
        username,
        password,
        firstName,
        lastName: surname,
        unsafeMetadata: {
          middleName,
          gender,
          contactNumber: formatPhilippinePhoneNumber(contactNumber),
          ...(suffix.trim() ? { suffix: suffix.trim() } : {}),
        },
      });
      if (error) {
        setRequestError(error.message);
        return;
      }

      if (signUp.status !== 'complete') {
        setRequestError(
          'Clerk requires additional signup fields or verification. Enable username signup and disable required email verification in Clerk settings.',
        );
        return;
      }

      const finalization = await signUp.finalize();
      if (finalization.error) setRequestError(finalization.error.message);
    } catch (caught) {
      setRequestError(caught instanceof Error ? caught.message : 'Account creation failed. Please try again.');
    }
  };

  const usernameFormatError = username && !USERNAME_PATTERN.test(username) ? USERNAME_HINT : undefined;
  const usernameError = errors.fields.username?.message || usernameFormatError;
  const passwordError = errors.fields.password?.message;
  const confirmPasswordError =
    confirmPassword.length > 0 && !passwordsMatch ? 'Passwords do not match.' : undefined;

  return (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="mb-5 text-center">
        <h2 className="text-xl font-semibold text-zinc-900">Create an account</h2>
        <p className="mt-1 text-sm text-zinc-600">Sign up to access your health center account.</p>
      </div>
      <AuthField
        id="first-name"
        label="First name"
        value={firstName}
        onChange={setFirstName}
        autoComplete="given-name"
      />
      <AuthField
        id="middle-name"
        label="Middle name"
        value={middleName}
        onChange={setMiddleName}
        autoComplete="additional-name"
      />
      <AuthField
        id="surname"
        label="Surname"
        value={surname}
        onChange={setSurname}
        autoComplete="family-name"
      />
      <div>
        <label htmlFor="sex-gender" className="mb-1.5 block text-sm font-medium text-zinc-800">
          Sex/Gender
        </label>
        <select
          id="sex-gender"
          name="sex-gender"
          required
          value={gender}
          onChange={(event) => setGender(event.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
        >
          <option value="" disabled>Select an option</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      </div>
      <div>
        <label htmlFor="suffix" className="mb-1.5 block text-sm font-medium text-zinc-800">
          Suffix (optional)
        </label>
        <select
          id="suffix"
          name="suffix"
          value={suffix}
          onChange={(event) => setSuffix(event.target.value)}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
        >
          <option value="">None</option>
          <option value="Jr.">Jr.</option>
          <option value="Sr.">Sr.</option>
          <option value="I">I</option>
          <option value="II">II</option>
          <option value="III">III</option>
          <option value="IV">IV</option>
          <option value="V">V</option>
        </select>
      </div>
      <AuthField
        id="username"
        label="Username"
        value={username}
        onChange={(value) => setUsername(value.toLowerCase())}
        error={usernameError}
        hint={USERNAME_HINT}
        autoComplete="username"
        minLength={3}
        maxLength={20}
        pattern="[a-z][a-z0-9_]{2,19}"
      />
      <div>
        <label htmlFor="signup-contact-number" className="mb-1.5 block text-sm font-medium text-zinc-800">
          Contact number
        </label>
        <div className="flex">
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-700">
            +63
          </span>
          <input
            id="signup-contact-number"
            name="contact-number"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={contactNumber}
            onChange={(event) => setContactNumber(normalizePhilippinePhoneNumber(event.target.value))}
            required
            minLength={10}
            maxLength={16}
            pattern="9[0-9]{9}"
            aria-describedby="signup-contact-number-hint"
            className="w-full rounded-r-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
          />
        </div>
        <p id="signup-contact-number-hint" className="mt-1 text-xs text-zinc-600">
          Enter 10 digits starting with 9.
        </p>
      </div>
      <AuthField
        id="password"
        label="Password"
        type="password"
        value={password}
        onChange={setPassword}
        error={passwordError}
        autoComplete="new-password"
        reveal={{ isVisible: passwordVisible, onToggle: () => setPasswordVisible((visible) => !visible) }}
      />
      <AuthField
        id="confirm-password"
        label="Confirm password"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        error={confirmPasswordError}
        autoComplete="new-password"
        reveal={{
          isVisible: confirmPasswordVisible,
          onToggle: () => setConfirmPasswordVisible((visible) => !visible),
        }}
      />
      {confirmPassword && passwordsMatch && (
        <p role="status" className="text-sm text-emerald-700">
          Passwords match.
        </p>
      )}
      {requestError && requestError !== passwordError && <p role="alert" className="text-sm text-rose-600">{requestError}</p>}
      <div id="clerk-captcha" />
      <button
        type="submit"
        disabled={isFetching || !passwordsMatch || !confirmPassword}
        className="w-full rounded-md bg-[#8b00ff] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#7600db] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isFetching ? 'Creating account...' : 'Continue'}
      </button>
    </form>
  );
};

export const AuthScreen: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const signUpAppearance = {
    variables: {
      colorPrimary: '#8b00ff',
      colorBackground: '#ffffff',
      colorText: '#18181b',
      colorTextSecondary: '#52525b',
      colorInputBackground: '#ffffff',
      colorInputText: '#18181b',
      borderRadius: '0.5rem',
    },
    elements: {
      rootBox: '!w-full !min-w-0 !max-w-full',
      cardBox: '!w-full !min-w-0 !max-w-full shadow-none',
      card: '!w-full !min-w-0 !max-w-full border-0 bg-transparent p-0 shadow-none',
      headerTitle: '!text-zinc-900',
      headerSubtitle: '!text-zinc-600',
      formFieldLabel: '!text-zinc-800',
      formFieldHintText: '!text-zinc-600',
      formFieldErrorText: '!text-rose-600',
      formFieldInput: 'border border-zinc-300 bg-white !text-zinc-900',
      phoneInputInput: '!text-zinc-900',
      socialButtonsBlockButton: '!border-zinc-300 !bg-white hover:!bg-zinc-50',
      socialButtonsBlockButtonText: '!text-zinc-800',
      dividerText: '!text-zinc-600',
      dividerLine: '!bg-zinc-300',
      formButtonPrimary: 'bg-[#8b00ff] hover:bg-[#7600db] shadow-none',
      footerActionText: '!text-zinc-600',
      footerActionLink: '!text-purple-700 hover:!text-purple-800',
      footerAction: '!hidden',
    },
  };
  const signInAppearance = {
    ...signUpAppearance,
    elements: {
      ...signUpAppearance.elements,
      headerTitle: '!text-center !text-zinc-900',
      headerSubtitle: '!text-center !text-zinc-600',
      identityPreviewText: '!text-zinc-900',
    },
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-950/60 px-3 py-4 text-zinc-900 sm:px-4 sm:py-8">
      <div className="flex min-h-full items-center justify-center">
      <section role="dialog" aria-modal="true" aria-label={isRegistering ? 'Create an account' : 'Log in'} className="relative mx-auto w-full min-w-0 max-w-md border border-zinc-200 bg-white shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
        <button type="button" onClick={onClose} aria-label="Close sign-in dialog" className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900">
          <X className="h-5 w-5" />
        </button>
        <div className="border-b border-zinc-200 px-4 py-4 sm:px-8 sm:py-5">
          <div className="flex items-center gap-3">
            <img src={centerPhoto} alt="Delfin Salonga Health Center" className="h-12 w-12 rounded-full border border-zinc-200 object-cover" />
            <div>
              <div className="text-sm font-bold text-zinc-900">Delfin Salonga</div>
              <div className="mt-0.5 text-xs text-zinc-600">Health Center</div>
            </div>
          </div>
        </div>

        <div className="min-w-0 px-3 py-5 sm:px-8 sm:py-7">
          {isRegistering ? (
            <CustomSignUpForm />
          ) : (
            <SignIn routing="hash" signUpUrl="#" appearance={signInAppearance} />
          )}
          <div className="mt-5 border-t border-zinc-200 pt-4 text-center text-sm text-zinc-600">
            {isRegistering ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsRegistering((registering) => !registering)}
              className="font-semibold text-purple-700 hover:text-purple-800"
            >
              {isRegistering ? 'Sign in' : 'Sign up'}
            </button>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
};
