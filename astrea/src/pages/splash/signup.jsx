import { Link } from "react-router-dom";

import Form from "../../components/form";

function Signup() {
    return (
        <>
            <Form mode="signup" navigateTo="/" />
        </>
    );
}

export default Signup;