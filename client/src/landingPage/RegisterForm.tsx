import { useState, useContext } from 'react';
import { Context } from '../context';

interface RegisterFormProps {
  register: (email: string, password: string) => void
}

export default function Register({ register }: RegisterFormProps) {
  const [fields, setFields] = useState({ email: '', password1: '', password2: '' });

  const { setAlert } = useContext(Context);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validPasswordRegex = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!validPasswordRegex.test(fields.password1)) {
      setAlert({
        message: 'Password must contain 1 uppercase, 1 lowercase, 1 number, 1 special character, and 8+ characters in total.',
        type: 'danger',
      });
      return;
    }

    if (fields.password1 !== fields.password2) {
      setAlert({ message: 'Passwords must match.', type: 'danger' });
      return;
    }

    register(fields.email, fields.password1);
    setFields({ email: '', password1: '', password2: '' });
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-3">
        <input
          type="email"
          className="form-control"
          name="email"
          placeholder="Email"
          value={fields.email}
          onChange={onChange}
        />
      </div>
      <div className="mb-3">
        <input
          type="password"
          className="form-control"
          name="password1"
          placeholder="Password"
          value={fields.password1}
          onChange={onChange}
        />
      </div>
      <div className="mb-3">
        <input
          type="password"
          className="form-control"
          name="password2"
          placeholder="Confirm Password"
          value={fields.password2}
          onChange={onChange}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Register
      </button>
    </form>
  );
}
