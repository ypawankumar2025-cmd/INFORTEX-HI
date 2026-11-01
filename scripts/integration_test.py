#!/usr/bin/env python3
"""Black-box tests against a running isolated HI server. Creates disposable accounts."""
import base64, http.cookiejar, json, os, time, urllib.request, urllib.error, uuid, io, zipfile
BASE=os.environ.get('HI_TEST_URL','http://127.0.0.1:8081')+'/api/'
checks=0
class Client:
    def __init__(self):
        self.jar=http.cookiejar.CookieJar(); self.http=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
    def call(self,path,method='GET',data=None,expect=200,headers=None):
        global checks
        h={'Content-Type':'application/json','X-HI-Request':'1'};h.update(headers or {})
        req=urllib.request.Request(BASE+path,data=None if data is None else json.dumps(data).encode(),headers=h,method=method)
        try:
            with self.http.open(req,timeout=70) as r: status=r.status; raw=r.read()
        except urllib.error.HTTPError as e: status=e.code;raw=e.read()
        result=json.loads(raw)
        assert status==expect,(path,status,expect,result)
        checks+=1
        return result
suffix=uuid.uuid4().hex[:10]; password='A-long-test-password-2026!'
a,b=Client(),Client()
for client,name in [(a,'Owner'),(b,'Other')]:
    client.mail=f'{name.lower()}-{suffix}@example.test'
    client.call('auth/register','POST',{'name':name,'email':client.mail,'password':password},201)
    client.me=client.call('auth/login','POST',{'email':client.mail,'password':password})
w=a.call('workspaces')[0]['id']
p=a.call(f'workspaces/{w}/projects','POST',{'name':'Event test','description':'Integration workflow'})['id']
b.call(f'projects/{p}',expect=404)
Client().call(f'projects/{p}',expect=401)
a.call('admin',expect=403)
a.call(f'projects/{p}/tasks','POST',{'title':'wrong'},400)
a.call(f'projects/{p}/tasks','POST',{'title':'x','status':'bad','priority':'high'},400)
a.call(f'projects/{p}/tasks','POST',{'title':'blocked','status':'backlog','priority':'high'},403,{'X-HI-Request':''})
a.call(f'projects/{p}/tasks','POST',{'title':'blocked','status':'backlog','priority':'high'},403,{'Origin':'https://evil.example'})
content='Campus technical event venue capacity is 320 students. AV equipment includes projector and microphones.'
a.call(f'projects/{p}/documents','POST',{'name':'venue.txt','base64':base64.b64encode(content.encode()).decode()})
r=a.call(f'projects/{p}/search','POST',{'query':'technical event venue capacity'})
assert r['results'][0]['name']=='venue.txt';checks+=1
b.call(f'projects/{p}/search','POST',{'query':'venue'},404)
a.call(f'projects/{p}/documents','POST',{'name':'evil.exe','base64':base64.b64encode(b'data').decode()},400)
a.call(f'projects/{p}/documents','POST',{'name':'../escape.txt','base64':base64.b64encode(b'data').decode()},400)
a.call(f'projects/{p}/documents','POST',{'name':'invalid.txt','base64':'!!!!'},400)
stream=io.BytesIO()
with zipfile.ZipFile(stream,'w') as z:z.writestr('word/document.xml','<w:document xmlns:w="w"><w:p><w:r><w:t>Registration opens at nine.</w:t></w:r></w:p></w:document>')
a.call(f'projects/{p}/documents','POST',{'name':'registration.docx','base64':base64.b64encode(stream.getvalue()).decode()})
# Minimal text PDF exercises the real pdftotext subprocess.
stream_data=b'BT /F1 12 Tf 40 120 Td (Technical event PDF requirements.) Tj ET'
objects=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',b'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',b'<< /Length '+str(len(stream_data)).encode()+b' >>\nstream\n'+stream_data+b'\nendstream']
pdf=b'%PDF-1.4\n'; offsets=[]
for index,obj in enumerate(objects,1):
    offsets.append(len(pdf));pdf+=str(index).encode()+b' 0 obj\n'+obj+b'\nendobj\n'
xref=len(pdf);pdf+=b'xref\n0 6\n0000000000 65535 f \n'
for offset in offsets:pdf+=f'{offset:010d} 00000 n \n'.encode()
pdf+=b'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+str(xref).encode()+b'\n%%EOF'
a.call(f'projects/{p}/documents','POST',{'name':'requirements.pdf','base64':base64.b64encode(pdf).decode()})
a.call(f'projects/{p}/runs','POST',{'prompt':'Plan this','budget':-10,'people':0},400)
r=a.call(f'projects/{p}/runs','POST',{'prompt':'Organize a technical event for 300 students with a budget of ₹50,000.','event':True,'budget':50000,'people':300})
for _ in range(120):
    run=a.call('runs/'+r['id'])
    if run['status'] not in ('queued','running'):break
    time.sleep(.2)
assert run['status']=='awaiting_review',run
assert len(run['executions'])==7,run
assert len(run['messages'])==7,run
assert len(run['proposal']['sources'])>0
assert run['proposal']['budget']['allocated_paise']==4500000
assert a.call(f'projects/{p}/tasks')==[];checks+=5
b.call('runs/'+r['id'],expect=404)
review=a.call(f"runs/{r['id']}/review",'POST',{'status':'approved'})
assert len(review['task_ids'])==6
before=a.call(f'projects/{p}/tasks');assert len(before)==6;checks+=2
a.call(f"runs/{r['id']}/review",'POST',{'status':'approved'},409)
assert len(a.call(f'projects/{p}/tasks'))==6;checks+=1
assert len(a.call(f'projects/{p}/milestones'))==2;checks+=1
# Invalid dates and duplicate prerequisites must be client errors, not 500s.
a.call(f'projects/{p}/milestones','POST',{'title':'Bad date','deadline':'2026-02-29'},400)
a.call(f'projects/{p}/tasks','POST',{'title':'Bad date','status':'backlog','priority':'low','deadline':'2026-04-31'},400)
a.call(f'projects/{p}/tasks','POST',{'title':'Duplicate prerequisites','status':'backlog','priority':'low','dependencies':[before[0]['id'],before[0]['id']]},400)
# A realistically sized valid base64 input must not exhaust the regex stack.
a.call(f'projects/{p}/documents','POST',{'name':'larger-notes.txt','base64':base64.b64encode(b'event evidence '*4000).decode()})
# Task state and cycle validation.
t1,t2=before[:2]
a.call(f"projects/{p}/tasks/{t2['id']}",'PATCH',{'dependencies':[t1['id']]})
a.call(f"projects/{p}/tasks/{t1['id']}",'PATCH',{'dependencies':[t2['id']]},400)
a.call(f"projects/{p}/tasks/{t2['id']}",'PATCH',{'status':'done'},409)
a.call(f"projects/{p}/tasks/{t1['id']}",'PATCH',{'status':'done'})
a.call(f"projects/{p}/tasks/{t2['id']}",'PATCH',{'status':'done'})
a.call(f"projects/{p}/tasks/{t1['id']}",'PATCH',{'status':'backlog'},409)
# SQL metacharacters remain data.
sqltitle="O'Reilly'); DROP TABLE tasks; --"
t=a.call(f'projects/{p}/tasks','POST',{'title':sqltitle,'status':'backlog','priority':'low'})
assert any(t['title']==sqltitle for t in a.call(f'projects/{p}/tasks'));checks+=1
# Restricted collaboration.
i=a.call(f'workspaces/{w}/invitations','POST',{'email':b.mail,'role':'viewer'})
a.call('invitations/accept','POST',{'token':i['token']},403)
b.call('invitations/accept','POST',{'token':i['token']})
b.call('invitations/accept','POST',{'token':i['token']},404)
b.call(f'projects/{p}/tasks')
b.call(f'projects/{p}/tasks','POST',{'title':'No access','status':'backlog','priority':'low'},403)
b.call(f'workspaces/{w}/invitations','POST',{'email':'third@example.test','role':'admin'},403)
a.call(f'workspaces/{w}/members/{b.me["id"]}','PATCH',{'role':'member'})
b.call(f'projects/{p}/comments','POST',{'content':'Evidence reviewed.'})
assert len(a.call(f'projects/{p}/comments'))==1;checks+=1
assert any('commented' in n['content'] for n in a.call('notifications'));checks+=1
# Enabled-state enforcement and project-only document retrieval.
a.call(f'workspaces/{w}/agents/planning','PATCH',{'enabled':False,'instructions':''})
a.call(f'projects/{p}/runs','POST',{'prompt':'Plan again'},409)
a.call(f'workspaces/{w}/agents/planning','PATCH',{'enabled':True,'instructions':''})
p2=a.call(f'workspaces/{w}/projects','POST',{'name':'Isolated project'})['id']
assert a.call(f'projects/{p2}/search','POST',{'query':'venue'})['results']==[];checks+=1
# Search cache must refresh after upload/delete and stay project-scoped.
indexed=a.call(f'projects/{p2}/documents','POST',{'name':'index-check.txt','base64':base64.b64encode(b'xylophone zirconium telescope').decode()})
for _ in range(2):
    matches=a.call(f'projects/{p2}/search','POST',{'query':'xylophone zirconium telescope'})['results']
    assert matches and matches[0]['document_id']==indexed['id'];checks+=1
a.call(f"projects/{p2}/documents/{indexed['id']}",'DELETE')
assert a.call(f'projects/{p2}/search','POST',{'query':'xylophone zirconium telescope'})['results']==[];checks+=1
# Member cannot approve; change request does not create tasks.
r2=b.call(f'projects/{p}/runs','POST',{'prompt':'Refine scope','agent':'planning'})
for _ in range(100):
    rr=b.call('runs/'+r2['id'])
    if rr['status'] not in ('queued','running'):break
    time.sleep(.1)
b.call(f"runs/{r2['id']}/review",'POST',{'status':'approved'},403)
a.call(f"runs/{r2['id']}/review",'POST',{'status':'changes_requested','feedback':'Need a volunteer plan'})
assert len(a.call(f'projects/{p}/tasks'))==7;checks+=1
assert a.call(f'workspaces/{w}/analytics')['agents'];checks+=1
# Titles must not cut a multibyte UTF-8 character in half.
unicode_run=a.call(f'projects/{p}/runs','POST',{'prompt':'a'*79+'₹ technical event','agent':'planning'})
for _ in range(100):
    unicode_status=a.call('runs/'+unicode_run['id'])
    if unicode_status['status'] not in ('queued','running'):break
    time.sleep(.1)
assert unicode_status['status']=='awaiting_review';checks+=1
a.call(f"runs/{unicode_run['id']}/review",'POST',{'status':'rejected'})
a.call(f'projects/{p}/conversations')

m=a.call(f'projects/{p}/milestones','POST',{'title':'Ready for launch','deadline':'2026-12-01'})
a.call(f'projects/{p}/milestones/{m["id"]}','PATCH',{'status':'done'})
a.call(f'projects/{p}/runs','POST',{'prompt':'Research','web_research':True,'search_query':'public facts'},expect=409)
a.call(f'projects/{p}/runs','POST',{'prompt':'Research','web_research':'yes'},expect=400)
# General AI Chat API: account-private and deliberately disabled in demo mode.
chat=a.call('chats','POST',{'title':'Private question'})
a.call('chats')
assert a.call(f"chats/{chat['id']}/messages")==[];checks+=1
b.call(f"chats/{chat['id']}/messages",expect=404)
b.call(f"chats/{chat['id']}",'DELETE',expect=404)
a.call(f"chats/{chat['id']}/messages",'POST',{'content':'Explain recursion'},409)
a.call(f"chats/{chat['id']}",'DELETE')
assert not any(t['id']==chat['id'] for t in a.call('chats'));checks+=1
a.call('auth/logout','POST',{})
a.call('me',expect=401)
a.call('auth/login','POST',{'email':a.mail,'password':password})
assert len(a.call(f'projects/{p}/tasks'))==7;checks+=1
print(json.dumps({'result':'passed','checks':checks,'workspace':w,'project':p},indent=2))
