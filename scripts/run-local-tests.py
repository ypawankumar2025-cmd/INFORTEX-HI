#!/usr/bin/env python3
"""Starts a disposable SQLite backend, tests it over HTTP, then removes test data."""
import os,subprocess,tempfile,time,urllib.request
from pathlib import Path
root=Path(__file__).resolve().parent.parent
binary=root/'build'/'hi_server'
with tempfile.TemporaryDirectory(prefix='hi-tests-') as temp:
    env=os.environ.copy()
    env.update(DATABASE_URL=str(Path(temp)/'test.db'),SCHEMA_PATH=str(root/'database'/'schema.sql'),PORT='18081',BIND_ADDRESS='127.0.0.1',AI_MODE='demo',ADMIN_EMAIL='')
    with open(Path(temp)/'server.log','w+') as log:
        server=subprocess.Popen([str(binary)],env=env,stdout=log,stderr=log)
        try:
            for _ in range(50):
                try:urllib.request.urlopen('http://127.0.0.1:18081/api/health',timeout=1);break
                except Exception:
                    if server.poll() is not None:raise RuntimeError('Server exited during startup')
                    time.sleep(.1)
            else:raise RuntimeError('Server did not become ready')
            testenv=env.copy();testenv['HI_TEST_URL']='http://127.0.0.1:18081'
            subprocess.run(['python3',str(root/'scripts'/'integration_test.py')],env=testenv,check=True)
            server.terminate();server.wait(timeout=10)
            # A new process must recover the same records, not an in-memory fixture.
            server=subprocess.Popen([str(binary)],env=env,stdout=log,stderr=log)
            for _ in range(50):
                try:urllib.request.urlopen('http://127.0.0.1:18081/api/health',timeout=1);break
                except Exception:time.sleep(.1)
            import sqlite3
            con=sqlite3.connect(env['DATABASE_URL'])
            assert con.execute('select count(*) from tasks').fetchone()[0]==7
            assert con.execute("select count(*) from approvals where status='approved'").fetchone()[0]==1
            con.close()
            print('Restart persistence: passed (7 tasks and approved decision retained).')
        except Exception:
            log.seek(0);print(log.read());raise
        finally:
            if server.poll() is None:server.terminate();server.wait(timeout=10)
