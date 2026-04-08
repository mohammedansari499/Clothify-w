import traceback
import importlib.util

try:
    spec = importlib.util.spec_from_file_location("main_app", "app.py")
    main_app = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(main_app)
    app = main_app.app
    client = app.test_client()
    app.testing = True
    response = client.post('/api/auth/register', json={"email": "flask990@test.com", "password": "pass"})
    print("Status:", response.status_code)
    try:
        print(response.get_json() or response.text)
    except:
        print(response.text)
except Exception as e:
    traceback.print_exc()
