import { useState } from 'react'

interface LoginFormProps {
	login: (email: string, password: string) => void
}

export default function LoginForm({ login }: LoginFormProps) {
	const [fields, setFields] = useState({ email: '', password: '' })

	const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFields({ ...fields, [e.target.name]: e.target.value })
	}

	const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		login(fields.email, fields.password)
		setFields({ email: '', password: '' })
	}

	return (
		<form onSubmit={onSubmit}>
			<div className='mb-3'>
				<input
					type='email'
					className='form-control'
					name='email'
					placeholder='Email'
					value={fields.email}
					onChange={onChange}
				/>
			</div>
			<div className='mb-3'>
				<input
					type='password'
					className='form-control'
					name='password'
					placeholder='Password'
					value={fields.password}
					onChange={onChange}
				/>
			</div>
			<button type='submit' className='btn btn-primary'>
				Login
			</button>
		</form>
	)
}
