import { Link } from "react-router-dom";

import Form from "../../components/form";

function Login() {
    return (
        <>
            <Form mode="login" navigateTo="/home" />
        </>
    );
}

export default Login;