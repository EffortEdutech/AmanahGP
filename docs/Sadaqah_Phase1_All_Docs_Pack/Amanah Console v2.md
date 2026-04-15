# 🧭 Amanah Platform — App Landscape (LOCK THIS)
We need crystal clarity of the ecosystem before writing the Console OS.

## Current Apps Status

App	                        Internal name	                    Status	                        Role
Amanah Hub	        user	                                   ✅ Completed	          Identity & personal workspace
Amanah OS	         org	                                    ✅ Stable	                Organisation workspace
Admin	                 amanah-hub-console	          ❌ Deprecated	          Old admin panel
Console	                 agp-console	                    🟡 New	                      Platform Operating System

This distinction is critical.
________________________________________

## 🧠 Platform Mental Model (Very Important)

Think of the ecosystem as 3 layers:

PERSON LAYER   → Amanah Hub (user)
ORG LAYER      → Amanah OS (org apps)
PLATFORM LAYER → AGP Console (new)

### 1️⃣ Amanah Hub (User App)

This is the personal identity layer.

A person can:
•	create account 
•	join many organisations 
•	switch between organisations 
•	receive invites 
•	manage personal profile 

This app should NEVER contain platform governance logic.
________________________________________

### 2️⃣ Amanah OS (Org App)

This is the organisation workspace.

Each org gets its own:
•	accounting 
•	governance 
•	reporting 
•	approvals 
•	internal operations 

This app should NEVER contain:
•	billing 
•	subscription 
•	platform roles 
•	system audit logs 
•	global permissions 

Those belong to Console.
________________________________________

### 3️⃣ AGP Console (NEW)

This will become the platform brain.

This is where:
•	organisations are created 
•	subscriptions are managed 
•	apps are provisioned 
•	permissions framework is defined 
•	compliance & audit is stored 

Console manages the entire ecosystem.
________________________________________

## 🚨 Why This Separation Is CRITICAL

Without Console:
You will mix:
•	org logic 
•	platform logic 
•	billing logic 
•	identity logic 

That leads to:
•	permission chaos 
•	audit failure 
•	compliance failure 
•	impossible scaling 
Console is what makes AGP a real SaaS platform.
________________________________________

## 📚 Documentation We Need To Create (In Order)
We will now start a documentation sprint before coding.
This will go into /docs/platform/.

### Document 1 — AGP Platform Architecture (Master Map)
File: AGP_PLATFORM_ARCHITECTURE.md

Explains:
•	All apps 
•	Responsibilities separation 
•	Data ownership boundaries 
•	Communication between apps 

This prevents future confusion forever.
________________________________________

### Document 2 — AGP Console OS (THE BIG ONE)
File: AGP_CONSOLE_OS.md

This is equivalent to:
amanah_gp_OS.md but for the platform layer.
This becomes the constitution of the Console app.

It will define:
•	platform roles 
•	org lifecycle 
•	app provisioning 
•	billing architecture 
•	compliance & audit model 
•	notification system 
•	permission engine ownership 

This is the MOST IMPORTANT doc.
________________________________________

### Document 3 — Identity & Tenancy Model
File: AGP_IDENTITY_TENANCY.md

Explains:
•	User vs Member vs Org vs Platform 
•	Multi-organisation membership 
•	Role separation 
•	Access boundaries 
________________________________________


### Document 4 — Console MVP Scope
File: AGP_CONSOLE_MVP.md

Defines:
•	what we build first 
•	what we intentionally postpone 
•	sprint scope 
Prevents feature creep.
________________________________________

### Document 5 — Migration Strategy
File: ADMIN_DEPRECATION_PLAN.md

Explains:
•	why admin is abandoned 
•	what code we salvage 
•	what we rewrite 
•	migration timeline 




# AGP_PLATFORM_ARCHITECTURE.md
Amanah Governance Platform (AGP)
Platform Architecture & Responsibility Boundaries
________________________________________

## 1. Introduction
Amanah Governance Platform (AGP) is a multi-tenant governance and accounting ecosystem designed for:
•	Masjids 
•	NGOs 
•	Foundations 
•	Waqf institutions 
•	Zakat bodies 
•	Social enterprises 
•	Government-linked organisations 

AGP is not a single app.
It is a platform of apps with strict separation of responsibilities.
This document defines the architecture boundaries to prevent future confusion, duplication, and governance risk.
________________________________________

## 2. Platform Philosophy

AGP follows a 3-Layer Architecture.
PERSON LAYER   → Identity & Membership
ORG LAYER      → Organisation Operations
PLATFORM LAYER → Governance & SaaS Infrastructure

Each layer owns different responsibilities and data.
Mixing these layers is strictly prohibited.
________________________________________

## 3. The Three Core Apps

### 3.1 PERSON LAYER — Amanah Hub (User App)
Internal package: apps/user
This app represents the individual human identity.
A person exists independently of any organisation.
Core Responsibilities

User app manages:
•	Account registration 
•	Authentication 
•	Personal profile 
•	Invitations to organisations 
•	Switching between organisations 
•	Personal notification inbox 

What the User App MUST NOT do
User app must NEVER contain:
•	Organisation settings 
•	Billing or subscription 
•	Platform roles 
•	Global permissions 
•	Audit logs 
•	Compliance workflows 

Those belong to Console.
________________________________________
### 3.2 ORG LAYER — Amanah OS (Organisation App)
Internal package: apps/org
This app is the workspace of an organisation.
Each organisation has its own isolated environment.

Core Responsibilities

Amanah OS manages:
•	Accounting & finance 
•	Governance workflows 
•	Projects & programmes 
•	Internal approvals 
•	Reports & dashboards 
•	Internal organisation members 
•	Internal organisation roles 

This is where the organisation does its work.

What the Org App MUST NOT do
Org app must NEVER contain:
•	SaaS billing 
•	Subscription plans 
•	Platform roles 
•	Global audit logs 
•	Organisation creation 
•	App provisioning 
•	Platform compliance status 

These belong to Console.
________________________________________
### 3.3 PLATFORM LAYER — AGP Console (New)

Internal package: apps/console
This app is the Platform Operating System.
Console manages the entire ecosystem.

If AGP were a country:
•	User App → Citizens 
•	Org App → Companies 
•	Console → Government 

Core Responsibilities

Console manages:

Organisation Lifecycle
•	Create organisation 
•	Verify organisation 
•	Manage legal profile 
•	Manage compliance status 
•	Suspend / archive organisations 

App Provisioning
•	Enable apps per organisation 
•	Provision org workspace 
•	Manage feature access 

Billing & Subscription
•	Plans & pricing 
•	Seats management 
•	Invoices & payments 
•	Subscription lifecycle 

Global Roles & Permissions
•	Platform roles 
•	Permission engine 
•	Access governance 

Audit & Compliance
•	Global activity log 
•	Compliance status 
•	Regulatory reporting 

Platform Notifications
•	Invites 
•	Billing alerts 
•	Compliance alerts 
•	Security alerts 

Console is the control plane of AGP.
________________________________________

## 4. Data Ownership Boundaries
This is one of the MOST IMPORTANT sections.

### 4.1 User Data (Owned by User App)
Examples:
•	email 
•	password 
•	personal profile 
•	login sessions 
•	personal notifications 
Org and Console may READ this data.
Only User App may WRITE this data.
________________________________________

### 4.2 Organisation Data (Owned by Org App)
Examples:
•	transactions 
•	reports 
•	projects 
•	approvals 
•	internal workflows 
Console may READ metadata only.
Console must NEVER access financial data directly.
________________________________________

### 4.3 Platform Data (Owned by Console)
Examples:
•	organisation registry 
•	subscriptions 
•	plans 
•	invoices 
•	audit logs 
•	platform roles 
•	app provisioning 
User and Org apps consume this data.
________________________________________

## 5. Tenancy Model
AGP is a multi-tenant platform.

Key rules:
1.	One user can belong to many organisations. 
2.	Each organisation has isolated data. 
3.	Permissions are evaluated at runtime. 
4.	Platform roles are separate from organisation roles. 
This separation is enforced by Console.
________________________________________

## 6. Communication Between Apps

Apps communicate via shared packages:
packages/
   auth/
   permissions/
   org-core/
   billing/
   audit/
   notifications/
   design-system/
No app should directly depend on another app.
All cross-app logic must live in shared packages.
________________________________________

## 7. Why the Old Admin App Is Deprecated

The previous admin app mixed:
•	Org logic 
•	Platform logic 
•	Identity logic 
•	Billing logic 

This created:
•	unclear responsibility boundaries 
•	permission risks 
•	compliance risks 
•	scaling limitations 

Therefore:
apps/admin → DEPRECATED
apps/console → NEW PLATFORM CONTROL PLANE

his is a strategic architectural reset.
________________________________________

## 8. Future Expansion
This architecture allows future apps:
•	Public Transparency Portal 
•	Zakat Management 
•	Waqf Management 
•	Grant Management 
•	Donor CRM 
All will be provisioned via Console.
________________________________________

## 9. Summary
AGP consists of three independent layers:
Layer	                        App	                    Purpose
Person	                       User	                   Identity & membership
Organisation	           Org	                   Daily operations
Platform	                  Console	           Governance & SaaS infrastructure

Maintaining this separation is essential for:
•	compliance 
•	scalability 
•	governance 
•	long-term sustainability 


# AGP_CONSOLE_OS.md
Amanah Governance Platform — Console Operating System
Version: Draft v1
Status: Foundational Constitution
________________________________________

## 1. Purpose of AGP Console
AGP Console is the Platform Operating System of the Amanah Governance Platform.
It is the control plane responsible for governing:
•	All organisations 
•	All applications 
•	All subscriptions 
•	All permissions 
•	All compliance and audit trails 
Console is NOT an admin panel.
It is a multi-tenant SaaS governance engine.
________________________________________

## 2. Why Console Exists
Without Console, the platform would suffer from:
•	Mixed responsibilities across apps 
•	Inconsistent permissions 
•	No central audit trail 
•	No subscription lifecycle 
•	No regulatory governance 
•	Impossible scaling 
Console centralises platform-level responsibilities so that:
•	User app stays personal 
•	Org app stays operational 
•	Console stays governmental 
________________________________________

## 3. Console Mental Model
Think of Console as the Government of the Platform.
Real World	AGP Equivalent
Citizens	Users
Companies	Organisations
Government	Console
Console governs the ecosystem but does not do the organisations’ daily work.
________________________________________

## 4. Core Console Engines
Console is composed of 7 platform engines.
________________________________________

### 4.1 Identity & Membership Engine
Purpose
Manage platform-level identity relationships.

Owns
•	Platform user registry (reference to User App) 
•	Invitations to platform 
•	Organisation membership registry 
•	User ↔ Organisation relationship 

Does NOT own
•	Passwords 
•	Authentication sessions
(these belong to User App) 
________________________________________

### 4.2 Organisation Lifecycle Engine
This engine manages the life of an organisation from birth to archival.

Organisation Lifecycle
Draft → Active → Suspended → Archived

Responsibilities
Create organisation:
•	Legal name 
•	Registration number 
•	Country & jurisdiction 
•	Organisation type (Masjid / NGO / Foundation / etc) 

Manage organisation profile:
•	Legal documents 
•	Registration certificates 
•	Verification status 
•	Compliance flags 

Control organisation status:
•	Activate 
•	Suspend 
•	Archive 
This is critical for regulatory governance.
________________________________________

### 4.3 App Provisioning Engine
This engine controls which apps an organisation can use.
Why it exists
Not every organisation needs every app.
Example
Masjid subscribes to:
•	Accounting ✅ 
•	Governance ✅ 
•	Public Portal ✅ 
•	CRM ❌ 
Console provisions apps automatically.

Responsibilities
•	App catalog 
•	Enable/disable app per org 
•	Provision org workspace 
•	Manage feature flags per plan 
________________________________________

### 4.4 Roles & Permission Engine (Platform Level)
This engine defines who can do what across the platform.
Two types of roles exist
Platform Roles
Apply across the entire platform.
Examples:
•	Platform Owner 
•	Platform Admin 
•	Support Agent 
•	Auditor 
Organisation Roles
Apply inside a specific organisation.
Examples:
•	Org Owner 
•	Org Admin 
•	Finance Officer 
•	Board Member 
•	Auditor 
Console manages the framework.
Org app consumes it.
________________________________________

### 4.5 Billing & Subscription Engine
This engine turns AGP into a real SaaS.
Owns
•	Plans & pricing 
•	Subscription lifecycle 
•	Seats per organisation 
•	Invoice generation 
•	Payment tracking 
•	Subscription status 
Subscription Lifecycle
Trial → Active → Past Due → Suspended → Cancelled
Billing Scope
Billing belongs to organisation, not user.
Users never subscribe.
Organisations subscribe.
________________________________________

### 4.6 Audit & Activity Engine
This is the regulatory backbone.
Every critical action across the platform must be logged.
Audit log records
•	Actor (who) 
•	Action (what) 
•	Resource (where) 
•	Organisation (context) 
•	Timestamp 
•	Source app 
Examples
•	User invited to organisation 
•	Role changed 
•	Subscription updated 
•	Organisation suspended 
•	App enabled/disabled 
This enables:
•	auditors 
•	regulators 
•	grant providers 
•	zakat institutions 
________________________________________

### 4.7 Notification Engine
Cross-platform notifications.
Examples
•	Invitation emails 
•	Billing alerts 
•	Compliance warnings 
•	Role change alerts 
•	Approval notifications 
This engine serves all apps.
________________________________________

## 5. Platform Roles
These roles live ONLY in Console.
Platform Owner
•	Full system control 
•	Manage plans & pricing 
•	Access all organisations 
•	Manage platform roles 
Platform Admin
•	Manage organisations 
•	Manage subscriptions 
•	Support operations 
Support Agent
•	Read-only access 
•	Help organisations 
Platform Auditor
•	Access audit logs only 
________________________________________

## 6. Organisation Lifecycle (Detailed)

Step 1 — Organisation Created
Created by a user via Console.
Status: Draft

Step 2 — Organisation Activated
Becomes active when:
•	profile completed 
•	owner assigned 
Status: Active

Step 3 — Organisation Suspended
Triggered when:
•	payment failure 
•	compliance issue 
•	manual suspension 
Status: Suspended

Step 4 — Organisation Archived
Closed or migrated.
Status: Archived
________________________________________

## 7. Data Owned by Console

Console owns ONLY platform-level data:
•	organisation registry 
•	membership registry 
•	platform roles 
•	subscriptions 
•	invoices 
•	audit logs 
•	app provisioning 
•	compliance status 

Console NEVER stores:
•	accounting data 
•	transactions 
•	org reports 
Those belong to Org App.
________________________________________

## 8. Console MVP Scope
Initial Console will focus on:
1.	Organisation management 
2.	User membership 
3.	Roles & permissions framework 
4.	App provisioning 
5.	Subscription management 
6.	Global audit log 
Advanced governance workflows come later.
________________________________________

## 9. Long-Term Vision
Console will evolve into:
•	Compliance automation engine 
•	Regulatory reporting engine 
•	Zakat & Waqf compliance hub 
•	Grant management oversight 
•	Public transparency control 
________________________________________

## 10. Conclusion
AGP Console is the foundation of the entire platform.
It enables AGP to become:
•	multi-tenant 
•	compliant 
•	scalable 
•	enterprise-ready 
All future development depends on this layer.



# AGP_IDENTITY_TENANCY.md
Amanah Governance Platform — Identity & Tenancy Model
Version: Draft v1
________________________________________

## 1. Why This Document Exists
Most SaaS platforms fail due to confusion between:
•	Users 
•	Members 
•	Organisations 
•	Platform roles 
This document defines the single source of truth for identity and access across AGP.
This model must be followed by ALL apps.
________________________________________

## 2. Core Identity Objects
AGP has four identity objects.
User → Membership → Organisation → Platform
Each has a different responsibility.
________________________________________

## 3. USER (Person Identity)
A User is a real human being.
A user exists independently of any organisation.
Owned by
User App (apps/user)
Examples of user data
•	email 
•	password 
•	name 
•	avatar 
•	login sessions 
•	MFA settings 
•	personal notifications 
Key Rule
A user can exist with zero organisations.
Example:
A person signs up but has not joined any org yet.
________________________________________

## 4. ORGANISATION (Tenant)
An Organisation is a tenant on the platform.
Owned by
Console (apps/console)
Organisation examples
•	Masjid 
•	NGO 
•	Foundation 
•	Waqf institution 
•	Zakat body 
•	Company 
Organisation properties
•	legal name 
•	registration number 
•	country / jurisdiction 
•	subscription plan 
•	status (draft / active / suspended / archived) 
Key Rule
An organisation can exist with one or many users.
________________________________________

## 5. MEMBERSHIP (The Bridge)
Membership connects a User to an Organisation.
This is the MOST IMPORTANT concept.
A user does NOT belong directly to an organisation.
A user has a membership in an organisation.
User 1 ── Membership A ── Org A
User 1 ── Membership B ── Org B
User 2 ── Membership C ── Org A

Membership stores
•	organisation_id 
•	user_id 
•	organisation role 
•	status (active / invited / suspended) 
•	joined_at 
•	invited_by 

Key Rules
1.	A user can have MANY memberships. 
2.	Each membership has its own role. 
3.	Leaving an organisation deletes membership, not user. 
________________________________________

## 6. Platform Role vs Organisation Role
This separation is non-negotiable.

### 6.1 Platform Roles (Console)
Apply across the entire platform.
Examples:
•	Platform Owner 
•	Platform Admin 
•	Support Agent 
•	Platform Auditor 
These roles:
•	live in Console 
•	ignore organisation boundaries 
________________________________________

### 6.2 Organisation Roles (Org App)
Apply only inside one organisation.
Examples:
•	Org Owner 
•	Org Admin 
•	Finance Officer 
•	Board Member 
•	Viewer 
These roles:
•	live inside membership 
•	are scoped per organisation 
________________________________________

## 7. A User Can Have BOTH Role Types
Example:
User	Platform Role	Org Role
Ali	Support Agent	Finance Officer @ Masjid A
Sarah	None	Org Owner @ NGO B
Ahmad	Platform Admin	Org Admin @ 3 organisations
This is expected behaviour.
________________________________________

## 8. Organisation Switching
Users may belong to many organisations.
Therefore the platform must support Organisation Context Switching.
The user always operates in a current organisation context.
Current Org Context → determines data access
This affects:
•	permissions 
•	API access 
•	UI menus 
•	audit logs 
________________________________________

## 9. Tenancy Isolation Rules
These rules protect organisation data.

Rule 1 — Org Data Isolation
Organisation A must NEVER access data from Organisation B.
Isolation is enforced by:
•	org_id in every org resource 
•	permission checks in backend 
________________________________________

Rule 2 — Platform Access Is Read-Only to Org Data
Console can see:
•	organisation metadata 
•	subscription 
•	audit logs 
Console must NEVER access:
•	accounting transactions 
•	internal org documents 
________________________________________

Rule 3 — Authentication Is Centralised
All apps share the same authentication system.
User logs in ONCE and can access:
•	User app 
•	Org app 
•	Console 
This is a single identity platform.
________________________________________

## 10. Invitation Flow
Typical flow:
1.	Org Admin invites email 
2.	Console creates invitation 
3.	Email sent via Notification Engine 
4.	User accepts invite 
5.	Membership created 
6.	Role assigned 
This flow lives in Console.
________________________________________

## 11. Deactivation Scenarios
Remove user from organisation
Delete membership only.
Suspend organisation
All memberships become inactive.
Delete user account
All memberships removed automatically.
________________________________________

## 12. Summary
AGP identity model:

Object	                Owned By	            Purpose
User	                 User App	               Human identity
Organisation	    Console	                  Tenant
Membership	      Console	                User ↔ Org bridge
Platform Role	    Console	                  Platform governance
Org Role	          Org App	                Org operations

This model enables:
•	multi-organisation users 
•	strict data isolation 
•	enterprise security 
•	regulatory compliance 

