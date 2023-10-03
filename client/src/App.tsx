import { useState } from 'react'

export default function App() {
	const [fields, setFields] = useState({ email: '', password1: '', password2: '' })

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFields({ ...fields, [e.target.name]: e.target.value })
	}

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()

		fetch('/api/register', {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username: fields.email, password: fields.password1 }),
		})
			.then((res) => res.text())
			.then((text) => console.log(text))
	}

	return (
		<div>
			<form onSubmit={onSubmit}>
				<input
					type='email'
					name='email'
					placeholder='Email'
					value={fields.email}
					onChange={onChange}
				/>
				<input
					type='password'
					name='password1'
					placeholder='Password'
					value={fields.password1}
					onChange={onChange}
				/>
				<input
					type='password'
					name='password2'
					placeholder='Confirm Password'
					value={fields.password2}
					onChange={onChange}
				/>
				<button type='submit'>Register</button>
			</form>
		</div>
	)
}
