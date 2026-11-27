import path from 'node:path';
import { access } from 'node:fs/promises';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

export const config = { maxDuration: 300 };
const MODEL_PATH = path.join(process.cwd(), 'models', 'WebZHost-Vertex-15M-Q8_0.gguf');
const SYSTEM = `You are WebZHost AI, the official assistant embedded in WebZHost (https://webzhost.vercel.app). Your identity is always WebZHost AI. Never claim to be JavaScript, a generic assistant, or a different model. Answer in the user's language. Be concise unless detail is requested. Use only the VERIFIED WEBZHOST FACTS supplied in the current prompt for claims about WebZHost. Never invent pages, endpoints, features, prices, limits, runtime support, integrations, or guarantees. If the supplied facts do not answer a WebZHost-specific question, say: "I can't verify that from the available WebZHost information yet." Distinguish implemented features from planned or unavailable features. For general programming questions, help normally but do not claim undocumented WebZHost integration. Never describe this model as highly capable; it is a tiny local model using retrieved context.`;

// Compiled from the supplied WebZHost 2.0 source archive and its README/configuration.
const KB = [
 {id:'identity',t:'WebZHost overview',k:'webzhost overview what is platform hosting',v:'WebZHost 2.0 is a web-based Telegram bot hosting and project-management panel. The supplied source describes a Vercel + Firebase Authentication + Firestore architecture. It is not a general-purpose cloud server that runs arbitrary user code.'},
 {id:'architecture',t:'Architecture and sign-in',k:'architecture vercel firebase firestore authentication login account email verification',v:'The project uses Vercel for the web app/API, Firebase Authentication for email/password sign-in, and a Firestore database named webzhost. The supplied source requires email verification. Firebase web configuration is public client configuration; no private service-account secret is included.'},
 {id:'bots',t:'Telegram bot features',k:'telegram bot create token welcome message commands keyword replies fallback buttons webhook',v:'Users can add Telegram bots using a bot token, set a welcome message, command replies, keyword replies, a default/fallback reply, and URL buttons. The platform configures Telegram webhooks and sends text replies. The supplied code ignores non-text updates and does not execute arbitrary user bot code.'},
 {id:'botlimits',t:'Bot rule limits',k:'bot rules limits commands keywords buttons reply length',v:'The supplied bot validation allows up to 50 command rules and 50 keyword rules. Each keyword rule can contain 1–20 words. A reply can have up to 8 buttons; reply text is limited to 4,000 characters. These are source-code defaults and may change in later deployments.'},
 {id:'projects',t:'File projects',k:'project upload zip create project files editor source code project',v:'Users can create file projects by uploading a ZIP archive or choosing a built-in template. Project files are stored in Firestore, can be browsed/edited/deleted, and can be exported as ZIP.'},
 {id:'templates',t:'Built-in templates',k:'template python node js api bot polling',v:'The supplied source includes a Python Telegram bot polling template and a Node.js HTTP API template. Templates are starter files only; their presence does not mean WebZHost currently provides a server to run them.'},
 {id:'runtime',t:'Execution runtime status',k:'run execute deploy start stop restart python node runtime server',v:'Important: in the supplied WebZHost source, runtimeUrl and runtimeSecret are empty. The runtime adapter therefore reports execution as unavailable and start/stop/restart operations return a runtime-unavailable error. Projects are stored and analyzed; arbitrary Python/Node programs are not actually executed by this source build. A separate execution server would be required.'},
 {id:'health',t:'Project health analysis',k:'health check analyzer errors warnings detect project',v:'The project includes a static project analyzer that detects project type/entry points and reports errors or warnings. Health analysis is not the same as running the project.'},
 {id:'backups',t:'Project backups',k:'backup restore export zip stored',v:'Project backups are ZIP snapshots stored in Firestore. Restore validates the archive before replacing files and attempts to create a safety backup first. The source limit for a backup ZIP is 700 KB.'},
 {id:'uploads',t:'Upload and project limits',k:'upload size file size files project limits 4mb 700kb 200 5mb',v:'Source-code limits: ZIP upload request up to 4 MB; up to 200 files per project; each file up to 700 KB; unpacked project total up to 5 MB; backup ZIP up to 700 KB. These are current source defaults, not a promise that every deployment has identical limits.'},
 {id:'plans',t:'Default subscription plans',k:'plans free starter pro price bdt usd bots projects monthly',v:'Default source plans: Free — ৳0, 1 bot, 2 projects; Starter — ৳99 or $1 for 30 days, 3 bots, 10 projects; Pro — ৳299 or $3 for 30 days, 10 bots, 50 projects. Admins can edit plans, so the live Plans page is authoritative for current pricing and limits.'},
 {id:'billing',t:'Manual payments and renewal',k:'payment billing bKash nagad binance transaction id manual approve renewal',v:'The source describes manual plan payments: a user submits a transaction ID using the configured payment details, and an admin approves or rejects it. Payment numbers are configured by an admin in Settings. Do not assume a payment is confirmed until the dashboard shows approval.'},
 {id:'grace',t:'Plan expiry and grace period',k:'expiry grace period expired bots paused three days',v:'The plan logic includes a 3-day renewal grace period after a paid plan ends. During grace, the paid plan remains effective. After grace, the account returns to Free limits and paid bots are paused.'},
 {id:'admin',t:'Admin tools',k:'admin dashboard users payments plans settings notices admins audit bots block notify',v:'The source admin panel includes overview, payments, users, plan assignment, user block/unblock, user notifications, plan editing, payment settings, notices, extra admins (maximum 3), bot listing/disable, and audit logs. The primary admin email is configured in source and must be verified.'},
 {id:'pwa',t:'Progressive web app',k:'pwa install mobile phone app',v:'The supplied project includes a web app manifest and service worker for Progressive Web App installation on supported browsers.'},
 {id:'privacy',t:'Code execution and safety',k:'security code execution user code sandbox privacy secrets',v:'The control plane does not run user-uploaded code. ZIP contents are validated and analyzed; they are stored as project files. Telegram bot replies are generated from configured rules, not by executing uploaded code.'},
 {id:'botoperations',t:'Bot lifecycle, logs and broadcasts',k:'bot start stop pause webhook logs chat list broadcast message send',v:'The bot panel supports start and stop through Telegram webhooks, token replacement, rule editing, recent chat listing, logs and broadcast. The supplied code retains the latest 100 log events for display. Broadcast sends to up to 300 recorded chats and is rate-limited to 3 broadcasts per bot per hour; the message is limited to 4,000 characters.'},
 {id:'projectfiles',t:'Project file management and validation',k:'project files edit delete rename export import zip archive security path validation',v:'Project files are stored in Firestore and can be browsed, edited, deleted and exported as ZIP. ZIP uploads are checked for unsafe paths, symbolic links, encrypted archives, invalid checksums and suspicious compression. Project contents are analyzed as data; they are not executed.'},
 {id:'projecttemplates',t:'Project templates and analysis',k:'python telegram polling template node http api requirements package json entrypoint health analyzer',v:'Two starter templates are present: a Python Telegram bot using polling and a Node.js HTTP API. The analyzer checks package.json or Python entry files, start commands, requirements and likely secret/token exposure. A template or detected start command does not mean an execution server exists.'},
 {id:'account',t:'Account, profile and notifications',k:'account profile email verification password reset notification notices user settings',v:'The source uses Firebase email/password authentication. The primary admin account must verify its email. The user area exposes profile name, plan state, bot/project usage, notices and personal notifications. The supplied README says Google sign-in is not built.'},
 {id:'broadcast',t:'Broadcast and bot activity limits',k:'broadcast rate limit chat logs events analytics',v:'Broadcast is limited to 3 requests per hour per bot and targets up to 300 recorded chats. Bot logs show up to the latest 100 events. The source does not provide advanced per-bot analytics beyond this recent log data.'},
 {id:'securitylimits',t:'Security and plan-limit caveats',k:'security firestore rules plan limits direct database writes admin entitlement secrets',v:'The API checks bot and project counts against the selected plan. The supplied README warns that a skilled user writing directly to Firestore could bypass count limits; closing that gap fully would require moving writes behind a service account. Plan entitlement records are admin-written. Never publish Telegram bot tokens or webhook hook IDs.'},
 {id:'docs',t:'Documentation',k:'documentation docs help guide official',v:'The configured documentation URL is https://webzhost.vercel.app/docs. The source archive supplied for this build does not contain the documentation page contents, so exact documentation wording and any newer features must be checked on the live site.'}
];

let llamaPromise;
let busy = Promise.resolve();
async function loadModel() {
 if (!llamaPromise) llamaPromise = (async()=>{
   await access(MODEL_PATH);
   const llama = await getLlama();
   const model = await llama.loadModel({ modelPath: MODEL_PATH, gpuLayers: 0 });
   return model;
 })().catch(e=>{ llamaPromise = null; throw e; });
 return llamaPromise;
}
const tokens = s => String(s||'').toLowerCase().normalize('NFKD').match(/[a-z0-9৳$]+|[\u0980-\u09ff]+/g)||[];
function retrieve(q) {
 const words = new Set(tokens(q));
 return KB.map(x=>({x,score:tokens(x.k+' '+x.t+' '+x.v).reduce((n,w)=>n+(words.has(w)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,4).map(x=>x.x);
}
function answerFromKB(q, found, bn) {
 if (!found.length) return null;
 const picked = found.slice(0,2);
 const lead = bn ? 'সরবরাহ করা WebZHost source অনুযায়ী:' : 'According to the supplied WebZHost source:';
 return lead + '\\n\\n' + picked.map(x=>'• '+x.v).join('\\n\\n') +
   (bn ? '\\n\\nএগুলো source-এর তথ্য; live deployment-এ Admin settings বা update-এর কারণে বদলাতে পারে।' : '\\n\\nThese are source-level details and may differ if the live deployment has been updated or configured differently.');
}

function deterministic(q) {
 const s=q.toLowerCase(), bn=/[\u0980-\u09ff]/.test(q);
 if (/\\b(who are you|what('?s| is) your name|your name|what are you called|who built you|who made you|who created you)\\b|কে তুমি|তোমার নাম|তুমি কে|কে বানিয়েছে|কে তৈরি করেছে/.test(s)) return bn?'আমি WebZHost AI — WebZHost-এর জন্য তৈরি সহকারী। WebZHost-এর যাচাইকৃত ফিচার, Telegram bot, project tools ও troubleshooting বুঝতে সাহায্য করি। সরবরাহ করা source-এ নির্মাতার ব্যক্তিগত পরিচয় উল্লেখ নেই।':'I’m WebZHost AI, the assistant configured for WebZHost. I help with verified WebZHost features, Telegram bots, project tools and troubleshooting. The supplied source does not identify an individual creator.';
 if (/what is webzhost|webzhost কী|ওয়েবজহোস্ট কী|ওয়েবজহোস্ট কী|ওয়েবজহোস্ট কি/.test(s)) return bn?'WebZHost 2.0 হলো Telegram bot hosting ও project-management panel। দেওয়া source অনুযায়ী এতে bot rules/webhooks, ZIP-based file projects, project editor, health analysis, backups, subscription plans ও admin tools আছে। তবে এই source build-এ Python/Node project চালানোর execution server configured নেই।':'WebZHost 2.0 is a Telegram bot hosting and project-management panel. The supplied source includes bot rules and webhooks, ZIP-based file projects, a project editor, health analysis, backups, subscription plans and admin tools. This source build does not have a configured Python/Node execution server.';
 if (/does it run|can it run|run python|run node|কোড চালায়|কোড রান|python চাল|node চাল/.test(s)) return bn?'না। সরবরাহ করা WebZHost source-এ execution server configured নেই। Project files সংরক্ষণ ও analyze করা যায়, কিন্তু arbitrary Python বা Node.js code চালানো যায় না।':'No. The supplied WebZHost source has no execution server configured. It can store and analyze project files, but it cannot execute arbitrary Python or Node.js code.';
 if (/plan|pricing|price|subscription|plans|দাম|প্ল্যান|প্রাইস/.test(s)) return bn?'Source-এর default plan: Free — ৳0, ১টি bot ও ২টি project; Starter — ৳99 বা $1/৩০ দিন, ৩টি bot ও ১০টি project; Pro — ৳299 বা $3/৩০ দিন, ১০টি bot ও ৫০টি project। Admin এগুলো পরিবর্তন করতে পারেন, তাই বর্তমান দাম Dashboard-এর Plans page-এ যাচাই করুন।':'Default source plans: Free — ৳0, 1 bot and 2 projects; Starter — ৳99 or $1 for 30 days, 3 bots and 10 projects; Pro — ৳299 or $3 for 30 days, 10 bots and 50 projects. Admins can edit these values, so verify live pricing on the Plans page.';
 if (/telegram bot|bot create|bot setup|কিভাবে বট|বট তৈরি|টেলিগ্রাম বট/.test(s)) return bn?'Telegram bot যোগ করতে bot token দিন। এরপর welcome message, command reply, keyword reply, fallback reply ও URL button সেট করতে পারবেন। Platform Telegram webhook ব্যবহার করে text message-এর উত্তর পাঠায়। Arbitrary bot code execute করে না।':'Add a Telegram bot using its bot token. You can configure a welcome message, command replies, keyword replies, a fallback reply and URL buttons. The platform uses Telegram webhooks to respond to text messages; it does not execute arbitrary bot code.';
 if (/backup|restore|ব্যাকআপ|রিস্টোর/.test(s)) return bn?'Project-এর ZIP snapshot backup হিসেবে Firestore-এ সংরক্ষিত হয়। Restore করার আগে archive validate করা হয় এবং সম্ভব হলে আগের অবস্থার safety backup তৈরি হয়। Source অনুযায়ী backup ZIP সর্বোচ্চ 700 KB।':'Project backups are ZIP snapshots stored in Firestore. Restore validates the archive first and attempts to create a safety backup. The source limit for a backup ZIP is 700 KB.';
 if (/upload limit|file limit|project limit|upload size|ফাইল সাইজ|আপলোড লিমিট/.test(s)) return bn?'Source-এর default সীমা: ZIP upload ৪ MB, প্রতি project-এ সর্বোচ্চ ২০০টি file, প্রতিটি file ৭০০ KB, unpacked project মোট ৫ MB এবং backup ZIP ৭০০ KB। এগুলো source defaults; live deployment-এ পরিবর্তন হতে পারে।':'Source defaults: ZIP upload up to 4 MB, 200 files per project, 700 KB per file, 5 MB total unpacked project size, and 700 KB per backup ZIP. These are source defaults and may differ if the live deployment has changed.';
 if (/payment|billing|bkash|nagad|binance|পেমেন্ট|পেমেন্ট/.test(s)) return bn?'Source-এ manual payment flow আছে: user transaction ID জমা দেন, admin approve বা reject করেন। Payment details Admin Settings-এ configure করা হয়। Dashboard-এ approval না দেখা পর্যন্ত payment confirmed ধরে নেবেন না।':'The source includes manual payments: users submit a transaction ID and an admin approves or rejects it. Payment details are configured in Admin Settings. Do not treat a payment as confirmed until the dashboard shows approval.';
 if (/admin|অ্যাডমিন/.test(s)) return bn?'Admin tools-এ overview, payments, users, plan assignment, block/unblock, notifications, plan editing, payment settings, notices, সর্বোচ্চ ৩ জন extra admin, bot management ও audit logs আছে। Primary admin account-এর email verified হতে হয়।':'Admin tools include overview, payments, users, plan assignment, block/unblock, notifications, plan editing, payment settings, notices, up to 3 extra admins, bot management and audit logs. The primary admin account must have a verified email.';
 return null;
}
function isWeb(q) { return /webzhost|web z host|ওয়েবজহোস্ট|ওয়েবজহোস্ট|এই প্ল্যাটফর্ম|এই সাইট|এই ওয়েবসাইট|এই ওয়েবসাইট/i.test(q); }
function isGeneralCode(q) { return /\b(html|css|javascript|typescript|python|node\.js|json|code|program|function|bug|error|কোড|প্রোগ্রাম|জাভাস্ক্রিপ্ট|পাইথন)\b/i.test(q); }
function shortTopicReply(q) {
 const s=q.trim().toLowerCase();
 if (/^(python|পাইথন)$/.test(s)) return /[\u0980-\u09ff]/.test(q) ? 'Python নিয়ে কী সাহায্য দরকার—কোড লেখা, error ঠিক করা, নাকি কোনো বিষয় শেখা?' : 'What do you need help with in Python—writing code, fixing an error, or learning a topic?';
 return null;
}
function sendJson(res, status, data) { return res.status(status).json(data); }
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST') return sendJson(res,405,{ok:false,error:'POST required'});
 const started=Date.now();
 try {
  const body=req.body||{}; const message=typeof body.message==='string'?body.message.trim():'';
  if(!message) return sendJson(res,400,{ok:false,error:'Message required'});
  if(message.length>1800) return sendJson(res,413,{ok:false,error:'Message is too long (limit 1,800 characters).'});
  const fixed=deterministic(message); if(fixed) return sendJson(res,200,{ok:true,answer:fixed,source:'verified WebZHost facts',timingsMs:{total:Date.now()-started}});
  const topicReply=shortTopicReply(message); if(topicReply) return sendJson(res,200,{ok:true,answer:topicReply,source:'clarification',timingsMs:{total:Date.now()-started}});
  const found=retrieve(message);
  const bn=/[\\u0980-\\u09ff]/.test(message);
  if(found.length && (isWeb(message) || /telegram|bot|project|backup|plan|payment|admin|upload|runtime|webhook|টেলিগ্রাম|বট|প্রজেক্ট|ব্যাকআপ|প্ল্যান|পেমেন্ট|অ্যাডমিন|আপলোড/i.test(message))) {
    const answer=answerFromKB(message,found,bn);
    return sendJson(res,200,{ok:true,answer,source:found.map(x=>x.id),timingsMs:{total:Date.now()-started}});
  }
  if(!found.length && isWeb(message)) return sendJson(res,200,{ok:true,answer:bn?'এই বিষয়টি সরবরাহ করা WebZHost source থেকে যাচাই করতে পারছি না। বিস্তারিত জানতে live documentation দেখুন: https://webzhost.vercel.app/docs.':'I can’t verify that WebZHost-specific detail from the supplied source. Please check the live documentation: https://webzhost.vercel.app/docs.',source:'verification fallback'});
  if(!found.length && !isGeneralCode(message)) return sendJson(res,200,{ok:true,answer:bn?'আমি WebZHost AI। WebZHost-এর যাচাইকৃত তথ্য ও সাধারণ web-development বিষয়ে সাহায্য করতে পারি। এই প্রশ্নের জন্য নির্ভরযোগ্য তথ্য পাইনি।':'I’m WebZHost AI. I can help with verified WebZHost information and general web-development questions. I could not find reliable information for this request.',source:'scope guard'});
  const model=await loadModel();
  const history=Array.isArray(body.history)?body.history.slice(-4).filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').map(m=>`${m.role==='user'?'User':'Assistant'}: ${m.content.slice(0,500)}`).join('\n'):' ';
  const context=found.map(x=>`[${x.t}] ${x.v}`).join('\n');
  const prompt=`Conversation so far:\n${history}\n\nUser's latest message: ${message}\n\nVERIFIED WEBZHOST FACTS (use only these for WebZHost claims):\n${context||'No WebZHost-specific facts were retrieved.'}\n\nAnswer directly. If the facts do not contain the answer, say it is not verified. Never make up details.`;
  const run=async()=>{
   const ctx=await model.createContext({contextSize:2048});
   try {
    const session=new LlamaChatSession({contextSequence:ctx.getSequence(),systemPrompt:SYSTEM});
    const answer=await session.prompt(prompt,{maxTokens:180,temperature:0.6,topP:0.9,repeatPenalty:1.3});
    return String(answer||'').trim();
   } finally { await ctx.dispose().catch(()=>{}); }
  };
  const task=busy.then(run,run); busy=task.catch(()=>{});
  const answer=await task;
  if(!answer || answer.length<2) throw new Error('Model returned an empty answer.');
  return sendJson(res,200,{ok:true,answer,source:found.map(x=>x.id),timingsMs:{total:Date.now()-started}});
 } catch(error) {
  console.error('WebZHost AI error:',error);
  return sendJson(res,503,{ok:false,error:'The AI model is not ready. Check /api/health and the deployment logs.',detail:String(error?.message||error).slice(0,240)});
 }
}
