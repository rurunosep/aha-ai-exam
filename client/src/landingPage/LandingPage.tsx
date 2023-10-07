import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';

interface LandingPageProps {
  login: (email: string, password: string) => void
  register: (email: string, password: string) => void
}

export default function LandingPage({ login, register }: LandingPageProps) {
  return (
    <div className="row">
      <div className="col">
        <div className="card mb-3">
          <div className="card-body">
            <h3 className="card-title">Login with Email</h3>
            <LoginForm login={login} />
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <a href="/api/auth/google" className="btn btn-primary">
              Login with Google
            </a>
          </div>
        </div>
      </div>
      <div className="col">
        <div className="card">
          <div className="card-body">
            <h3 className="card-title">Register with Email</h3>
            <RegisterForm register={register} />
          </div>
        </div>
      </div>
    </div>
  );
}
