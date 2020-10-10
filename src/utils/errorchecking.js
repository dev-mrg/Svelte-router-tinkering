function Auth(props) {
    // State for all inputs
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
  
    // Whether to show errors
    // We set to true if they submit and there are errors.
    // We only show errors after they submit because
    // it's annoying to see errors while typing.
    const [showErrors, setShowErrors] = useState(false);
  
    // Error array we'll populate
    let errors = [];
  
    // Function for fetching error for a field
    const getError = field => {
      return errors.find(e => e.field === field);
    };
  
    // Function to see if field is empty
    const isEmpty = val => val.trim() === "";
  
    // Add error if email empty
    if (["signin", "signup", "forgotpass"].includes(props.mode)) {
      if (isEmpty(email)) {
        errors.push({
          field: "email",
          message: "Please enter an email"
        });
      }
    }
  
    // Add error if password empty
    if (["signin", "signup", "changepass"].includes(props.mode)) {
      if (isEmpty(pass)) {
        errors.push({
          field: "pass",
          message: "Please enter a password"
        });
      }
    }
  
    // Add error if confirmPass empty or
    // if it doesn't match pass.
    // Only for signup and changepass views.
    if (["signup", "changepass"].includes(props.mode)) {
      if (isEmpty(confirmPass)) {
        errors.push({
          field: "confirmPass",
          message: "Please confirm password"
        });
      } else if (pass !== confirmPass) {
        errors.push({
          field: "confirmPass",
          message: `This doesn't match your password`
        });
      }
    }
  
    // Handle form submission
    const handleSubmit = () => {
      // If field errors then show them
      if (errors.length) {
        setShowErrors(true);
      } else {
        // Otherwise call onSubmit with email/pass
        if (props.onSubmit) {
          props.onSubmit({
            email,
            pass
          });
        }
      }
    };
  
    return (
      <div className="Auth">
        {props.status.message && (
          <FormStatus
            type={props.status.type}
            message={props.status.message}
          ></FormStatus>
        )}
  
        <Form
          onSubmit={e => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {["signup", "signin", "forgotpass"].includes(props.mode) && (
            <Form.Group controlId="formEmail">
              <FormField
                size={props.inputSize}
                value={email}
                type="email"
                placeholder="Email"
                required={true}
                error={showErrors && getError("email")}
                onChange={e => setEmail(e.target.value)}
              ></FormField>
            </Form.Group>
          )}
  
          {["signup", "signin", "changepass"].includes(props.mode) && (
            <Form.Group controlId="formPassword">
              <FormField
                size={props.inputSize}
                value={pass}
                type="password"
                placeholder="Password"
                required={true}
                error={showErrors && getError("pass")}
                onChange={e => setPass(e.target.value)}
              ></FormField>
            </Form.Group>
          )}
  
          {["signup", "changepass"].includes(props.mode) && (
            <Form.Group controlId="formConfirmPass">
              <FormField
                size={props.inputSize}
                value={confirmPass}
                type="password"
                placeholder="Confirm Password"
                required={true}
                error={showErrors && getError("confirmPass")}
                onChange={e => setConfirmPass(e.target.value)}
              ></FormField>
            </Form.Group>
          )}
  
          <Button
            variant="primary"
            block={true}
            size={props.inputSize}
            type="submit"
            disabled={props.status.type === "pending"}
          >
            <span>{props.buttonText}</span>
  
            {props.status.type === "pending" && (
              <Spinner
                animation="border"
                size="sm"
                role="status"
                aria-hidden={true}
                className="ml-2"
              >
                <span className="sr-only">Sending...</span>
              </Spinner>
            )}
          </Button>
        </Form>
  
        {["signup", "signin"].includes(props.mode) && (
          <div className="Auth__bottom-link text-center mt-3">
            {props.mode === "signup" && (
              <>
                Have an account already?
                <Link to="/signin">Sign in</Link>
              </>
            )}
  
            {props.mode === "signin" && (
              <>
                <Link to="/signup">Create an account</Link>
                <Link to="/forgotpass">Forgot password</Link>
              </>
            )}
          </div>
        )}
      </div>
    );
  }