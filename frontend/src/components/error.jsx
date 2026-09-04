import { useState } from "react";

import "../styles/error.css";

function Error({ message }) {
    return (
        <div className="error">
            <p>{message}</p>
        </div>
    );
}

export default Error;