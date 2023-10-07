import { useState } from 'react';

interface ChangeNameFormProps {
  changeName: (newName: string) => void
}

export default function ChangeNameForm({ changeName }: ChangeNameFormProps) {
  const [fields, setFields] = useState({ newName: '' });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    changeName(fields.newName);
    setFields({ newName: '' });
  };

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          name="newName"
          placeholder="New Name"
          value={fields.newName}
          onChange={onChange}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Change Display Name
      </button>
    </form>
  );
}
