'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  HiOutlineCode,
  HiOutlineLightningBolt,
  HiOutlineChip,
  HiOutlineDatabase,
  HiOutlineColorSwatch,
  HiOutlineCloudUpload,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineSparkles,
  HiOutlineRefresh,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClipboardCopy,
  HiOutlineTrash,
  HiOutlineChevronLeft,
  HiOutlineShoppingCart,
  HiOutlineUserGroup,
  HiOutlineClipboardCheck,
  HiOutlinePencilAlt,
  HiOutlineChatAlt2,
  HiOutlineCollection,
  HiOutlineViewGrid,
  HiOutlineDocumentText,
  HiOutlineStatusOnline,
  HiOutlineArrowRight,
  HiOutlineMenuAlt2,
  HiOutlineTemplate,
  HiOutlineCubeTransparent,
  HiOutlineServer,
} from 'react-icons/hi'

// ---- Constants ----

const AGENT_ID = '699b5df3efd91aca1f09f67f'

const THEME_VARS = {
  '--background': '230 25% 7%',
  '--foreground': '220 15% 92%',
  '--card': '230 22% 10%',
  '--card-foreground': '220 15% 92%',
  '--primary': '220 90% 56%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '230 20% 15%',
  '--secondary-foreground': '220 15% 85%',
  '--accent': '270 80% 60%',
  '--accent-foreground': '0 0% 100%',
  '--muted': '230 18% 16%',
  '--muted-foreground': '220 12% 55%',
  '--border': '230 18% 18%',
  '--input': '230 18% 14%',
  '--ring': '220 90% 56%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 100%',
  '--radius': '0.75rem',
} as Record<string, string>

type TabId = 'overview' | 'tech' | 'features' | 'architecture' | 'database' | 'api' | 'ui' | 'code' | 'deployment'

interface AppBlueprint {
  app_name: string
  app_description: string
  target_audience: string
  tech_stack: string
  features: string
  architecture: string
  database_schema: string
  api_design: string
  ui_design: string
  code_snippets: string
  deployment_guide: string
  estimated_timeline: string
  cost_estimate: string
}

interface HistoryItem {
  id: string
  prompt: string
  data: AppBlueprint
  timestamp: number
}

interface TemplateItem {
  name: string
  icon: React.ComponentType<{ className?: string }>
  prompt: string
}

const TEMPLATES: TemplateItem[] = [
  { name: 'E-Commerce Store', icon: HiOutlineShoppingCart, prompt: 'Build a modern e-commerce store with product listings, shopping cart, checkout with Stripe payments, user accounts, order tracking, admin dashboard for managing products and orders, search and filtering, product reviews, and wishlist functionality.' },
  { name: 'Social Network', icon: HiOutlineUserGroup, prompt: 'Create a social networking app with user profiles, friend connections, news feed with posts/photos/videos, likes and comments, direct messaging, groups, events, notifications, and privacy settings.' },
  { name: 'Task Manager', icon: HiOutlineClipboardCheck, prompt: 'Build a project management and task tracking app with kanban boards, task assignments, due dates, priority levels, file attachments, team collaboration, time tracking, progress reports, and calendar integration.' },
  { name: 'Blog Platform', icon: HiOutlinePencilAlt, prompt: 'Create a blogging platform with a rich text editor, markdown support, categories and tags, comments system, user subscriptions, analytics dashboard, SEO optimization, RSS feed, and social sharing.' },
  { name: 'Chat App', icon: HiOutlineChatAlt2, prompt: 'Build a real-time chat application with one-on-one messaging, group chats, file sharing, read receipts, typing indicators, emoji reactions, search messages, user presence status, and push notifications.' },
  { name: 'Portfolio Site', icon: HiOutlineCollection, prompt: 'Create a professional portfolio website builder with customizable themes, project showcases with images/videos, skills section, work experience timeline, testimonials, contact form, blog section, and analytics.' },
]

const PROGRESS_STEPS = [
  'Analyzing Requirements',
  'Designing Architecture',
  'Planning Database',
  'Creating API Design',
  'Designing UI/UX',
  'Generating Code',
  'Planning Deployment',
]

const TAB_CONFIG: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: HiOutlineViewGrid },
  { id: 'tech', label: 'Tech Stack', icon: HiOutlineChip },
  { id: 'features', label: 'Features', icon: HiOutlineLightningBolt },
  { id: 'architecture', label: 'Architecture', icon: HiOutlineCubeTransparent },
  { id: 'database', label: 'Database', icon: HiOutlineDatabase },
  { id: 'api', label: 'API Design', icon: HiOutlineServer },
  { id: 'ui', label: 'UI/UX', icon: HiOutlineColorSwatch },
  { id: 'code', label: 'Code', icon: HiOutlineCode },
  { id: 'deployment', label: 'Deployment', icon: HiOutlineCloudUpload },
]

const SAMPLE_BLUEPRINT: AppBlueprint = {
  app_name: 'TaskFlow Pro',
  app_description: 'A modern project management application with real-time collaboration, kanban boards, and AI-powered task prioritization. Designed for agile teams of 5-50 members who need streamlined workflow management.',
  target_audience: 'Small to medium-sized software development teams, startup project managers, and freelance professionals who need an intuitive yet powerful task management solution.',
  tech_stack: '## Frontend\n- **Next.js 14** - React framework with App Router\n- **TypeScript** - Type-safe development\n- **Tailwind CSS** - Utility-first styling\n- **Framer Motion** - Animations\n\n## Backend\n- **Node.js** with Express\n- **PostgreSQL** - Primary database\n- **Redis** - Caching and real-time pub/sub\n- **Socket.io** - WebSocket connections\n\n## Infrastructure\n- **Docker** - Containerization\n- **AWS** - Cloud hosting (ECS, RDS, ElastiCache)\n- **GitHub Actions** - CI/CD pipeline',
  features: '## Core Features\n1. **Kanban Board** - Drag-and-drop task management with customizable columns\n2. **Sprint Planning** - Create and manage sprints with velocity tracking\n3. **Real-time Collaboration** - Live updates, cursors, and presence indicators\n4. **AI Task Prioritization** - Smart suggestions for task ordering\n\n## User Management\n5. **Team Workspaces** - Create and manage team spaces\n6. **Role-based Access** - Admin, Manager, Member roles\n7. **Activity Feed** - Track all changes and updates\n\n## Productivity\n8. **Time Tracking** - Built-in timer with reports\n9. **Calendar View** - Visualize deadlines and milestones\n10. **File Attachments** - Upload and preview documents\n11. **Search & Filters** - Advanced search with saved filters\n12. **Notifications** - Email, push, and in-app alerts',
  architecture: '## System Architecture\n\n### Client Layer\n- Next.js SSR/CSR hybrid rendering\n- Service Worker for offline support\n- WebSocket client for real-time updates\n\n### API Layer\n- RESTful API for CRUD operations\n- GraphQL subscriptions for real-time data\n- Rate limiting and request validation\n\n### Service Layer\n- **AuthService** - JWT authentication with refresh tokens\n- **TaskService** - Task CRUD and state management\n- **NotificationService** - Multi-channel notifications\n- **AIService** - Task analysis and prioritization\n\n### Data Layer\n- PostgreSQL for persistent storage\n- Redis for session cache and pub/sub\n- S3 for file storage',
  database_schema: '```sql\n-- Users table\nCREATE TABLE users (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  email VARCHAR(255) UNIQUE NOT NULL,\n  name VARCHAR(255) NOT NULL,\n  avatar_url TEXT,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\n-- Workspaces table\nCREATE TABLE workspaces (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name VARCHAR(255) NOT NULL,\n  owner_id UUID REFERENCES users(id),\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\n-- Tasks table\nCREATE TABLE tasks (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  title VARCHAR(500) NOT NULL,\n  description TEXT,\n  status VARCHAR(50) DEFAULT \'todo\',\n  priority INTEGER DEFAULT 0,\n  assignee_id UUID REFERENCES users(id),\n  workspace_id UUID REFERENCES workspaces(id),\n  due_date TIMESTAMP,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n\n-- Comments table\nCREATE TABLE comments (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  task_id UUID REFERENCES tasks(id),\n  user_id UUID REFERENCES users(id),\n  content TEXT NOT NULL,\n  created_at TIMESTAMP DEFAULT NOW()\n);\n```',
  api_design: '## REST API Endpoints\n\n### Authentication\n- `POST /api/auth/register` - Create new account\n- `POST /api/auth/login` - Authenticate user\n- `POST /api/auth/refresh` - Refresh access token\n\n### Tasks\n- `GET /api/tasks` - List tasks (supports filtering, pagination)\n- `POST /api/tasks` - Create new task\n- `GET /api/tasks/:id` - Get task details\n- `PUT /api/tasks/:id` - Update task\n- `DELETE /api/tasks/:id` - Delete task\n- `PATCH /api/tasks/:id/status` - Update task status\n\n### Workspaces\n- `GET /api/workspaces` - List user workspaces\n- `POST /api/workspaces` - Create workspace\n- `POST /api/workspaces/:id/invite` - Invite member\n\n### Comments\n- `GET /api/tasks/:id/comments` - List task comments\n- `POST /api/tasks/:id/comments` - Add comment',
  ui_design: '## UI Component Hierarchy\n\n### Layout\n- **AppShell** - Main layout with sidebar and content area\n- **Sidebar** - Navigation, workspace selector, user menu\n- **TopBar** - Search, notifications, quick actions\n\n### Views\n- **KanbanBoard** - Drag-and-drop columns with task cards\n- **ListView** - Table view with sorting and filtering\n- **CalendarView** - Monthly/weekly calendar with task dots\n- **TimelineView** - Gantt-style project timeline\n\n### Components\n- **TaskCard** - Compact card with title, assignee, priority badge\n- **TaskModal** - Detailed task view with comments, attachments\n- **MemberAvatar** - User avatar with online status indicator\n- **FilterBar** - Advanced filtering with saved presets\n\n### Design Tokens\n- Primary: Blue (#3B82F6)\n- Success: Green (#10B981)\n- Warning: Amber (#F59E0B)\n- Error: Red (#EF4444)\n- Font: Inter, system-ui\n- Spacing: 4px base unit\n- Border Radius: 8px default',
  code_snippets: '```typescript\n// Task Service - Core CRUD Operations\nimport { db } from \'./database\';\nimport { Task, CreateTaskInput } from \'./types\';\n\nexport class TaskService {\n  async createTask(input: CreateTaskInput): Promise<Task> {\n    const task = await db.task.create({\n      data: {\n        title: input.title,\n        description: input.description,\n        status: \'todo\',\n        priority: input.priority ?? 0,\n        assigneeId: input.assigneeId,\n        workspaceId: input.workspaceId,\n        dueDate: input.dueDate,\n      },\n    });\n    await this.notifyAssignee(task);\n    return task;\n  }\n\n  async updateStatus(taskId: string, status: string): Promise<Task> {\n    const task = await db.task.update({\n      where: { id: taskId },\n      data: { status },\n    });\n    await this.broadcastUpdate(task);\n    return task;\n  }\n\n  async getTasks(workspaceId: string, filters?: TaskFilters): Promise<Task[]> {\n    return db.task.findMany({\n      where: {\n        workspaceId,\n        ...this.buildFilterQuery(filters),\n      },\n      orderBy: { priority: \'desc\' },\n      include: { assignee: true, comments: true },\n    });\n  }\n}\n```\n\n```typescript\n// Real-time WebSocket Handler\nimport { Server } from \'socket.io\';\n\nexport function setupWebSocket(io: Server) {\n  io.on(\'connection\', (socket) => {\n    socket.on(\'join-workspace\', (workspaceId: string) => {\n      socket.join(`workspace:${workspaceId}`);\n    });\n\n    socket.on(\'task-update\', (data) => {\n      socket.to(`workspace:${data.workspaceId}`)\n        .emit(\'task-changed\', data);\n    });\n  });\n}\n```',
  deployment_guide: '## Deployment Guide\n\n### Step 1: Environment Setup\n1. Install Docker and Docker Compose\n2. Configure environment variables in `.env`\n3. Set up AWS credentials\n\n### Step 2: Database Setup\n1. Create PostgreSQL instance on AWS RDS\n2. Run database migrations: `npx prisma migrate deploy`\n3. Seed initial data: `npx prisma db seed`\n\n### Step 3: Build & Deploy\n1. Build Docker image: `docker build -t taskflow-pro .`\n2. Push to ECR: `docker push <ecr-url>/taskflow-pro`\n3. Deploy to ECS: `aws ecs update-service --force-new-deployment`\n\n### Step 4: Configure CDN\n1. Set up CloudFront distribution\n2. Configure custom domain with Route 53\n3. Enable SSL with ACM certificate\n\n### Step 5: Monitoring\n1. Set up CloudWatch alarms for CPU/Memory\n2. Configure error tracking with Sentry\n3. Set up uptime monitoring with Pingdom\n\n### Step 6: Post-Deployment\n1. Run smoke tests against production\n2. Enable auto-scaling policies\n3. Configure backup schedules for RDS',
  estimated_timeline: '## Development Timeline\n\n- **Week 1-2**: Project setup, authentication, database schema\n- **Week 3-4**: Core task CRUD, kanban board UI\n- **Week 5-6**: Real-time collaboration, WebSocket integration\n- **Week 7-8**: Sprint planning, calendar view, time tracking\n- **Week 9-10**: AI prioritization, search, notifications\n- **Week 11-12**: Testing, bug fixes, deployment\n\n**Total Estimated Time: 12 weeks (3 months)**\n\nWith a team of 2-3 developers, this timeline accounts for iterative development with weekly sprints and continuous testing.',
  cost_estimate: '## Cost Breakdown\n\n### Development Costs\n- 3 developers x 12 weeks x $5,000/week = **$180,000**\n- UI/UX Designer (part-time): **$15,000**\n- QA Testing: **$10,000**\n\n### Monthly Infrastructure (Production)\n- AWS ECS (2 instances): **$150/mo**\n- RDS PostgreSQL: **$100/mo**\n- ElastiCache Redis: **$50/mo**\n- S3 + CloudFront: **$30/mo**\n- Monitoring & Logging: **$20/mo**\n\n**Monthly Hosting Total: ~$350/mo**\n\n### Third-Party Services\n- SendGrid (email): **$20/mo**\n- Sentry (error tracking): **$26/mo**\n- GitHub Team: **$4/user/mo**\n\n**Total Project Cost: ~$205,000**\n**Monthly Running Cost: ~$400/mo**',
}

// ---- Helpers ----

function parseAgentResult(result: any): any {
  let data = result?.response?.result
  if (typeof data === 'string') {
    try { data = JSON.parse(data) } catch { return { text: data } }
  }
  return data ?? {}
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        const trimmed = line.trim()
        if (trimmed.startsWith('```')) return null
        if (trimmed.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1 text-foreground">{trimmed.slice(4)}</h4>
        if (trimmed.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-4 mb-1 text-foreground">{trimmed.slice(3)}</h3>
        if (trimmed.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2 text-foreground">{trimmed.slice(2)}</h2>
        if (trimmed.startsWith('- ') || trimmed.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm text-secondary-foreground">{formatInline(trimmed.slice(2))}</li>
        if (/^\d+\.\s/.test(trimmed))
          return <li key={i} className="ml-4 list-decimal text-sm text-secondary-foreground">{formatInline(trimmed.replace(/^\d+\.\s/, ''))}</li>
        if (!trimmed) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm text-secondary-foreground">{formatInline(trimmed)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) {
    // Handle inline code
    const codeParts = text.split(/`(.*?)`/g)
    if (codeParts.length === 1) return text
    return codeParts.map((part, i) =>
      i % 2 === 1 ? <code key={i} className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono text-foreground">{part}</code> : part
    )
  }
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
  )
}

function renderCodeBlock(text: string) {
  if (!text) return null
  const blocks: React.ReactNode[] = []
  const lines = text.split('\n')
  let inCodeBlock = false
  let codeLines: string[] = []
  let codeLang = ''
  let nonCodeLines: string[] = []

  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('```') && !inCodeBlock) {
      // Flush non-code content first
      if (nonCodeLines.length > 0) {
        const content = nonCodeLines.join('\n')
        blocks.push(<div key={`text-${idx}`}>{renderMarkdown(content)}</div>)
        nonCodeLines = []
      }
      inCodeBlock = true
      codeLang = trimmed.slice(3).trim()
      codeLines = []
    } else if (trimmed === '```' && inCodeBlock) {
      inCodeBlock = false
      const codeContent = codeLines.join('\n')
      blocks.push(
        <CodeBlockDisplay key={`code-${idx}`} code={codeContent} language={codeLang} />
      )
      codeLines = []
      codeLang = ''
    } else if (inCodeBlock) {
      codeLines.push(line)
    } else {
      nonCodeLines.push(line)
    }
  })

  // Flush remaining non-code content
  if (nonCodeLines.length > 0) {
    const content = nonCodeLines.join('\n')
    blocks.push(<div key="text-final">{renderMarkdown(content)}</div>)
  }
  // Flush remaining code lines if block wasn't closed
  if (codeLines.length > 0) {
    const codeContent = codeLines.join('\n')
    blocks.push(
      <CodeBlockDisplay key="code-final" code={codeContent} language={codeLang} />
    )
  }

  return <div className="space-y-4">{blocks}</div>
}

// ---- Sub-components ----

function CodeBlockDisplay({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [code])

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-[hsl(230,25%,5%)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
        <span className="text-xs font-mono text-muted-foreground">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? (
            <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied</>
          ) : (
            <><HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy</>
          )}
        </button>
      </div>
      <ScrollArea className="max-h-[400px]">
        <pre className="p-4 text-xs font-mono leading-relaxed text-[hsl(220,15%,80%)] overflow-x-auto">
          <code>{code}</code>
        </pre>
      </ScrollArea>
    </div>
  )
}

function ProgressIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <HiOutlineRefresh className="w-5 h-5 text-primary animate-spin" />
        <span className="text-sm font-medium text-foreground">Generating your app blueprint...</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentStep + 1) / PROGRESS_STEPS.length) * 100}%`,
            background: 'linear-gradient(90deg, hsl(220,90%,56%), hsl(270,80%,60%))',
          }}
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {PROGRESS_STEPS.map((step, idx) => {
          const isComplete = idx < currentStep
          const isActive = idx === currentStep
          return (
            <div key={step} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isComplete ? 'bg-green-400' : isActive ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
              <span className={`text-xs truncate ${isComplete ? 'text-green-400' : isActive ? 'text-primary font-medium' : 'text-muted-foreground/50'}`}>{step}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ResultSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-5 w-28 bg-muted" />
              <Skeleton className="h-4 w-full bg-muted" />
              <Skeleton className="h-4 w-3/4 bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-6 w-40 bg-muted" />
          <Skeleton className="h-4 w-full bg-muted" />
          <Skeleton className="h-4 w-full bg-muted" />
          <Skeleton className="h-4 w-2/3 bg-muted" />
          <Skeleton className="h-32 w-full bg-muted" />
        </CardContent>
      </Card>
    </div>
  )
}

function InlineMessage({ type, message, onDismiss }: { type: 'success' | 'error' | 'info'; message: string; onDismiss?: () => void }) {
  const colorMap = {
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    error: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  const iconMap = {
    success: <HiOutlineCheckCircle className="w-4 h-4 flex-shrink-0" />,
    error: <HiOutlineExclamationCircle className="w-4 h-4 flex-shrink-0" />,
    info: <HiOutlineStatusOnline className="w-4 h-4 flex-shrink-0" />,
  }
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${colorMap[type]}`}>
      {iconMap[type]}
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="flex-shrink-0 hover:opacity-70">
          <HiOutlineX className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

function AgentInfoPanel({ activeAgentId, appsGenerated }: { activeAgentId: string | null; appsGenerated: number }) {
  return (
    <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs">
          <HiOutlineLightningBolt className="w-4 h-4 text-primary" />
          <span className="font-semibold text-foreground">AI Agent</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId ? 'bg-amber-400 animate-pulse' : 'bg-green-400'}`} />
          <span className={`${activeAgentId ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
            App Builder Agent
          </span>
        </div>
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Apps Generated</span>
            <span className="font-semibold text-foreground">{appsGenerated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- ErrorBoundary ----

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function Page() {
  // ---- State ----
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [blueprint, setBlueprint] = useState<AppBlueprint | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [progressStep, setProgressStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showSampleData, setShowSampleData] = useState(false)
  const [appsGenerated, setAppsGenerated] = useState(0)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Cleanup progress interval
  useEffect(() => {
    return () => {
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [])

  // Word count
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0

  // Active blueprint (sample or real)
  const activeBlueprint = showSampleData && !blueprint ? SAMPLE_BLUEPRINT : blueprint

  // ---- Handlers ----

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError(null)
    setBlueprint(null)
    setActiveTab('overview')
    setProgressStep(0)
    setActiveAgentId(AGENT_ID)

    // Simulate progress
    let step = 0
    progressRef.current = setInterval(() => {
      step += 1
      if (step < PROGRESS_STEPS.length) {
        setProgressStep(step)
      }
    }, 2500)

    try {
      const result = await callAIAgent(prompt, AGENT_ID)
      if (progressRef.current) clearInterval(progressRef.current)
      setProgressStep(PROGRESS_STEPS.length - 1)

      if (result.success) {
        const data = parseAgentResult(result)
        const bp: AppBlueprint = {
          app_name: data?.app_name ?? '',
          app_description: data?.app_description ?? '',
          target_audience: data?.target_audience ?? '',
          tech_stack: data?.tech_stack ?? '',
          features: data?.features ?? '',
          architecture: data?.architecture ?? '',
          database_schema: data?.database_schema ?? '',
          api_design: data?.api_design ?? '',
          ui_design: data?.ui_design ?? '',
          code_snippets: data?.code_snippets ?? '',
          deployment_guide: data?.deployment_guide ?? '',
          estimated_timeline: data?.estimated_timeline ?? '',
          cost_estimate: data?.cost_estimate ?? '',
        }
        setBlueprint(bp)
        setAppsGenerated(prev => prev + 1)

        // Add to history
        const historyItem: HistoryItem = {
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          prompt: prompt,
          data: bp,
          timestamp: Date.now(),
        }
        setHistory(prev => [historyItem, ...prev])

        // Scroll to results after short delay
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 200)
      } else {
        setError(result?.error ?? 'Failed to generate app blueprint. Please try again.')
      }
    } catch (err) {
      if (progressRef.current) clearInterval(progressRef.current)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
      setActiveAgentId(null)
    }
  }, [prompt])

  const handleTemplateClick = useCallback((templatePrompt: string) => {
    setPrompt(templatePrompt)
  }, [])

  const handleHistoryClick = useCallback((item: HistoryItem) => {
    setBlueprint(item.data)
    setPrompt(item.prompt)
    setActiveTab('overview')
    setShowSampleData(false)
  }, [])

  const handleDeleteHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(h => h.id !== id))
  }, [])

  const handleStartOver = useCallback(() => {
    setPrompt('')
    setBlueprint(null)
    setActiveTab('overview')
    setError(null)
    setProgressStep(0)
  }, [])

  const handleCopySection = useCallback(async (text: string, sectionName: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(sectionName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedField(sectionName)
      setTimeout(() => setCopiedField(null), 2000)
    }
  }, [])

  // ---- Render ----

  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans">
        {/* Background gradient mesh */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, hsl(220,90%,56%) 0%, transparent 70%)' }} />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-[0.04]" style={{ background: 'radial-gradient(circle, hsl(270,80%,60%) 0%, transparent 70%)' }} />
          <div className="absolute top-[40%] left-[50%] w-[40%] h-[40%] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, hsl(200,80%,50%) 0%, transparent 70%)' }} />
        </div>

        <div className="relative flex min-h-screen" style={{ zIndex: 1 }}>
          {/* ===== SIDEBAR (History) ===== */}
          <aside className={`flex-shrink-0 flex flex-col border-r border-border bg-card/60 backdrop-blur-xl transition-all duration-300 ${sidebarOpen ? 'w-72' : 'w-0 overflow-hidden'}`}>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <HiOutlineClock className="w-4 h-4 text-primary" />
                  History
                </h3>
                <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <HiOutlineChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {history.length === 0 ? (
                  <div className="text-center py-8">
                    <HiOutlineDocumentText className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">No apps generated yet</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Your history will appear here</p>
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="group relative">
                      <button
                        onClick={() => handleHistoryClick(item)}
                        className="w-full text-left p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-muted/50 transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground truncate">{item.data?.app_name || 'Untitled App'}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.prompt}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteHistory(item.id) }}
                        className="absolute top-2 right-2 p-1 rounded-md text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Agent Info */}
            <div className="p-3 border-t border-border">
              <AgentInfoPanel activeAgentId={activeAgentId} appsGenerated={appsGenerated} />
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* ---- HEADER ---- */}
            <header className="flex-shrink-0 border-b border-border bg-card/40 backdrop-blur-xl">
              <div className="px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!sidebarOpen && (
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
                    >
                      <HiOutlineMenuAlt2 className="w-5 h-5" />
                    </button>
                  )}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(220,90%,56%), hsl(270,80%,60%))' }}>
                      <HiOutlineTemplate className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div>
                      <h1 className="text-base font-bold text-foreground tracking-tight leading-none">AppForge</h1>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">Build Any App. For Free.</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
                  <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={(checked) => { setShowSampleData(checked); if (!checked && !blueprint) { /* nothing to do */ } }} />
                </div>
              </div>
              {/* Animated gradient border */}
              <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, hsl(220,90%,56%), hsl(270,80%,60%), hsl(220,90%,56%), transparent)' }} />
            </header>

            {/* ---- SCROLLABLE CONTENT ---- */}
            <ScrollArea className="flex-1">
              <div className="p-6 max-w-5xl mx-auto space-y-8">

                {/* ===== HERO / INPUT SECTION ===== */}
                <div className="space-y-5">
                  {/* Headline */}
                  <div className="text-center space-y-2 pt-4">
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                      What do you want to build?
                    </h2>
                    <p className="text-sm text-muted-foreground max-w-xl mx-auto">
                      Describe your app idea in detail and our AI will generate a complete blueprint including architecture, database schema, API design, code snippets, and deployment guide.
                    </p>
                  </div>

                  {/* Textarea */}
                  <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06] shadow-lg shadow-primary/5">
                    <CardContent className="p-5 space-y-4">
                      <div className="relative">
                        <Textarea
                          placeholder="Describe the app you want to build... Be as detailed as possible. Include features, target users, and any specific requirements."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          rows={5}
                          className="bg-input/50 border-border text-foreground placeholder:text-muted-foreground/60 text-sm resize-none focus:border-primary/50"
                          disabled={loading}
                        />
                        <span className="absolute bottom-3 right-3 text-xs text-muted-foreground/50">
                          {wordCount} {wordCount === 1 ? 'word' : 'words'}
                        </span>
                      </div>

                      {/* Quick Start Templates */}
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Quick Start Templates:</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                          {TEMPLATES.map((tpl) => {
                            const IconComp = tpl.icon
                            return (
                              <button
                                key={tpl.name}
                                onClick={() => handleTemplateClick(tpl.prompt)}
                                disabled={loading}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all duration-200 text-center disabled:opacity-50"
                              >
                                <IconComp className="w-4 h-4 text-primary" />
                                <span className="text-xs text-secondary-foreground font-medium leading-tight">{tpl.name}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>

                      {/* Generate Button */}
                      <Button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className="w-full h-12 text-sm font-semibold gap-2 transition-all duration-300"
                        style={{
                          background: loading ? 'hsl(230, 18%, 16%)' : 'linear-gradient(135deg, hsl(220,90%,56%), hsl(270,80%,60%))',
                          boxShadow: loading ? 'none' : '0 4px 24px -4px hsla(220,90%,56%,0.4)',
                        }}
                      >
                        {loading ? (
                          <>
                            <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                            Generating Blueprint...
                          </>
                        ) : (
                          <>
                            <HiOutlineSparkles className="w-4 h-4" />
                            Generate App Blueprint
                            <HiOutlineArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Error */}
                  {error && (
                    <InlineMessage type="error" message={error} onDismiss={() => setError(null)} />
                  )}
                </div>

                {/* ===== PROGRESS INDICATOR ===== */}
                {loading && (
                  <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
                    <CardContent className="p-5">
                      <ProgressIndicator currentStep={progressStep} />
                    </CardContent>
                  </Card>
                )}

                {/* ===== LOADING SKELETONS ===== */}
                {loading && <ResultSkeleton />}

                {/* ===== RESULTS DASHBOARD ===== */}
                {activeBlueprint && !loading && (
                  <div ref={resultsRef} className="space-y-6">
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-1">
                      {TAB_CONFIG.map((tab) => {
                        const TabIcon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 ${isActive ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                          >
                            <TabIcon className="w-3.5 h-3.5" />
                            {tab.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* ---- OVERVIEW TAB ---- */}
                    {activeTab === 'overview' && (
                      <div className="space-y-4">
                        {/* Hero Card */}
                        <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06] overflow-hidden">
                          <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, hsl(220,90%,56%), hsl(270,80%,60%), hsl(220,90%,56%))' }} />
                          <CardContent className="p-6 space-y-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1 flex-1">
                                <h2 className="text-xl font-bold text-foreground">{activeBlueprint?.app_name || 'Untitled App'}</h2>
                                <div className="text-sm text-secondary-foreground leading-relaxed">
                                  {renderMarkdown(activeBlueprint?.app_description ?? '')}
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                              {/* Target Audience */}
                              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <HiOutlineUserGroup className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Audience</span>
                                </div>
                                <p className="text-sm text-secondary-foreground">{activeBlueprint?.target_audience || 'Not specified'}</p>
                              </div>

                              {/* Timeline */}
                              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <HiOutlineClock className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Timeline</span>
                                </div>
                                <div className="text-sm text-secondary-foreground">
                                  {renderMarkdown(activeBlueprint?.estimated_timeline ?? 'Not specified')}
                                </div>
                              </div>

                              {/* Cost */}
                              <div className="p-4 rounded-lg bg-muted/30 border border-border/50 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <HiOutlineCurrencyDollar className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cost Estimate</span>
                                </div>
                                <div className="text-sm text-secondary-foreground">
                                  {renderMarkdown(activeBlueprint?.cost_estimate ?? 'Not specified')}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* ---- TECH STACK TAB ---- */}
                    {activeTab === 'tech' && (
                      <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <HiOutlineChip className="w-5 h-5 text-primary" />
                              Technology Stack
                            </CardTitle>
                            <button
                              onClick={() => handleCopySection(activeBlueprint?.tech_stack ?? '', 'tech')}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedField === 'tech' ? <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          {renderMarkdown(activeBlueprint?.tech_stack ?? '')}
                        </CardContent>
                      </Card>
                    )}

                    {/* ---- FEATURES TAB ---- */}
                    {activeTab === 'features' && (
                      <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <HiOutlineLightningBolt className="w-5 h-5 text-primary" />
                              Features
                            </CardTitle>
                            <button
                              onClick={() => handleCopySection(activeBlueprint?.features ?? '', 'features')}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedField === 'features' ? <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          {renderMarkdown(activeBlueprint?.features ?? '')}
                        </CardContent>
                      </Card>
                    )}

                    {/* ---- ARCHITECTURE TAB ---- */}
                    {activeTab === 'architecture' && (
                      <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <HiOutlineCubeTransparent className="w-5 h-5 text-primary" />
                              System Architecture
                            </CardTitle>
                            <button
                              onClick={() => handleCopySection(activeBlueprint?.architecture ?? '', 'architecture')}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedField === 'architecture' ? <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          {renderMarkdown(activeBlueprint?.architecture ?? '')}
                        </CardContent>
                      </Card>
                    )}

                    {/* ---- DATABASE TAB ---- */}
                    {activeTab === 'database' && (
                      <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <HiOutlineDatabase className="w-5 h-5 text-primary" />
                              Database Schema
                            </CardTitle>
                            <button
                              onClick={() => handleCopySection(activeBlueprint?.database_schema ?? '', 'database')}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedField === 'database' ? <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          {renderCodeBlock(activeBlueprint?.database_schema ?? '')}
                        </CardContent>
                      </Card>
                    )}

                    {/* ---- API DESIGN TAB ---- */}
                    {activeTab === 'api' && (
                      <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <HiOutlineServer className="w-5 h-5 text-primary" />
                              API Design
                            </CardTitle>
                            <button
                              onClick={() => handleCopySection(activeBlueprint?.api_design ?? '', 'api')}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedField === 'api' ? <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          {renderCodeBlock(activeBlueprint?.api_design ?? '')}
                        </CardContent>
                      </Card>
                    )}

                    {/* ---- UI/UX TAB ---- */}
                    {activeTab === 'ui' && (
                      <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <HiOutlineColorSwatch className="w-5 h-5 text-primary" />
                              UI/UX Design
                            </CardTitle>
                            <button
                              onClick={() => handleCopySection(activeBlueprint?.ui_design ?? '', 'ui')}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedField === 'ui' ? <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          {renderMarkdown(activeBlueprint?.ui_design ?? '')}
                        </CardContent>
                      </Card>
                    )}

                    {/* ---- CODE TAB ---- */}
                    {activeTab === 'code' && (
                      <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <HiOutlineCode className="w-5 h-5 text-primary" />
                              Code Snippets
                            </CardTitle>
                            <button
                              onClick={() => handleCopySection(activeBlueprint?.code_snippets ?? '', 'code')}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedField === 'code' ? <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          {renderCodeBlock(activeBlueprint?.code_snippets ?? '')}
                        </CardContent>
                      </Card>
                    )}

                    {/* ---- DEPLOYMENT TAB ---- */}
                    {activeTab === 'deployment' && (
                      <Card className="backdrop-blur-xl bg-card/80 border border-white/[0.06]">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                              <HiOutlineCloudUpload className="w-5 h-5 text-primary" />
                              Deployment Guide
                            </CardTitle>
                            <button
                              onClick={() => handleCopySection(activeBlueprint?.deployment_guide ?? '', 'deployment')}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {copiedField === 'deployment' ? <><HiOutlineCheckCircle className="w-3.5 h-3.5 text-green-400" /> Copied</> : <><HiOutlineClipboardCopy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-2">
                          {renderMarkdown(activeBlueprint?.deployment_guide ?? '')}
                        </CardContent>
                      </Card>
                    )}

                    {/* ---- BOTTOM SECTION ---- */}
                    <div className="flex items-center justify-between pt-4 pb-8">
                      <Button
                        onClick={handleStartOver}
                        variant="outline"
                        className="gap-2 border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      >
                        <HiOutlineRefresh className="w-4 h-4" />
                        Start Over
                      </Button>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <HiOutlineSparkles className="w-4 h-4 text-primary" />
                        <span>{appsGenerated} {appsGenerated === 1 ? 'app' : 'apps'} generated this session</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ===== EMPTY STATE (no blueprint, no loading, no sample) ===== */}
                {!activeBlueprint && !loading && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, hsl(220,90%,56%,0.15), hsl(270,80%,60%,0.15))' }}>
                      <HiOutlineCode className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Ready to build something amazing?</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Describe your app idea above or choose a quick start template to get started. Our AI will generate a complete development blueprint in seconds.
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
