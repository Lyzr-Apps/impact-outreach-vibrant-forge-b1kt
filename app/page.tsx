'use client'

import React, { useState, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  HiOutlineViewGrid,
  HiOutlineMail,
  HiOutlineChartBar,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePlus,
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
  HiOutlineStatusOnline,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineX,
  HiOutlineInbox,
  HiOutlineLightningBolt,
  HiOutlineBadgeCheck,
  HiOutlineTag,
  HiOutlineHeart,
} from 'react-icons/hi'

// ---- Constants ----

const AGENT_IDS = {
  outreach: '699b56e499a581580fa60369',
  sender: '699b56fb67cd897226785e4f',
  engagement: '699b570d1558055656c1d7d4',
  followup: '699b571f67cd897226785e51',
} as const

const THEME_VARS = {
  '--background': '160 35% 96%',
  '--foreground': '160 35% 8%',
  '--card': '160 30% 99%',
  '--card-foreground': '160 35% 8%',
  '--primary': '160 85% 35%',
  '--primary-foreground': '0 0% 100%',
  '--secondary': '160 30% 93%',
  '--secondary-foreground': '160 35% 12%',
  '--accent': '45 95% 50%',
  '--accent-foreground': '160 35% 8%',
  '--muted': '160 25% 90%',
  '--muted-foreground': '160 25% 40%',
  '--border': '160 28% 88%',
  '--input': '160 25% 85%',
  '--ring': '160 85% 35%',
  '--destructive': '0 84% 60%',
  '--destructive-foreground': '0 0% 100%',
  '--radius': '0.875rem',
  '--chart-1': '160 85% 35%',
  '--chart-2': '45 95% 50%',
  '--chart-3': '280 65% 55%',
  '--chart-4': '200 70% 50%',
  '--chart-5': '340 75% 55%',
  '--sidebar-background': '160 35% 97%',
  '--sidebar-primary': '160 85% 35%',
} as Record<string, string>

// ---- Types ----

type ScreenName = 'dashboard' | 'compose' | 'engagement' | 'followups'

interface Lead {
  id: string
  name: string
  organization: string
  email: string
  status: 'sent' | 'replied' | 'no_response' | 'active_thread' | 'followup_sent' | 'meeting_scheduled'
  lastContactDate: string
  role?: string
  interests?: string
  notes?: string
  originalSnippet?: string
}

interface ComposeForm {
  name: string
  organization: string
  role: string
  interests: string
  context: string
  givingHistory: string
}

interface EmailPreview {
  subject: string
  body: string
  toneNotes: string
  recipientEmail: string
}

interface FollowUpForm {
  leadName: string
  organization: string
  engagementStatus: string
  originalSnippet: string
  followupType: 'warm_followup' | 're_engagement' | 'meeting_request'
}

interface FollowUpPreview {
  subject: string
  body: string
  followupType: string
  strategyNotes: string
  recipientEmail: string
}

interface EngagementLead {
  name: string
  email: string
  organization: string
  status: string
  days_since_contact: number
  last_email_snippet: string
  thread_summary: string
}

// ---- Sample data ----

const initialSampleLeads: Lead[] = [
  { id: '1', name: 'Sarah Chen', organization: 'Impact Foundation', email: 'sarah@impactfdn.org', status: 'replied', lastContactDate: '2026-02-18', role: 'Director of Giving', interests: 'Education reform' },
  { id: '2', name: 'Marcus Johnson', organization: 'Greenfield Ventures', email: 'marcus@greenfield.vc', status: 'no_response', lastContactDate: '2026-02-10', role: 'Partner', interests: 'Social enterprise' },
  { id: '3', name: 'Priya Patel', organization: 'Social Good Fund', email: 'priya@socialgood.org', status: 'sent', lastContactDate: '2026-02-20', role: 'Program Manager', interests: 'Community development' },
  { id: '4', name: 'David Kim', organization: 'Catalyst Capital', email: 'david@catalyst.com', status: 'active_thread', lastContactDate: '2026-02-15', role: 'Managing Director', interests: 'Impact investing' },
  { id: '5', name: 'Elena Rodriguez', organization: 'Welfare First Alliance', email: 'elena@welfarefirst.org', status: 'meeting_scheduled', lastContactDate: '2026-02-19', role: 'Executive Director', interests: 'Welfare reform' },
  { id: '6', name: 'James Wright', organization: 'Community Trust', email: 'james@commtrust.org', status: 'followup_sent', lastContactDate: '2026-02-12', role: 'Grants Officer', interests: 'Poverty alleviation' },
]

// ---- Helpers ----

function parseAgentResult(result: any): any {
  let data = result?.response?.result
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      // If parsing fails, return as-is wrapped
      return { text: data }
    }
  }
  return data ?? {}
}

function getStatusConfig(status: string): { label: string; colorClasses: string } {
  switch (status) {
    case 'sent':
      return { label: 'Sent', colorClasses: 'bg-blue-100 text-blue-700 border-blue-200' }
    case 'replied':
      return { label: 'Replied', colorClasses: 'bg-green-100 text-green-700 border-green-200' }
    case 'no_response':
      return { label: 'No Response', colorClasses: 'bg-amber-100 text-amber-700 border-amber-200' }
    case 'active_thread':
      return { label: 'Active Thread', colorClasses: 'bg-blue-100 text-blue-700 border-blue-200' }
    case 'followup_sent':
      return { label: 'Follow-Up Sent', colorClasses: 'bg-purple-100 text-purple-700 border-purple-200' }
    case 'meeting_scheduled':
      return { label: 'Meeting Scheduled', colorClasses: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
    case 'no_response_7d':
      return { label: 'No Response 7d+', colorClasses: 'bg-red-100 text-red-700 border-red-200' }
    case 'recently_sent':
      return { label: 'Recently Sent', colorClasses: 'bg-gray-100 text-gray-600 border-gray-200' }
    default:
      return { label: status || 'Unknown', colorClasses: 'bg-gray-100 text-gray-600 border-gray-200' }
  }
}

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-2">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h4>
        if (line.startsWith('## '))
          return <h3 key={i} className="font-semibold text-base mt-3 mb-1">{line.slice(3)}</h3>
        if (line.startsWith('# '))
          return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{line.slice(2)}</h2>
        if (line.startsWith('- ') || line.startsWith('* '))
          return <li key={i} className="ml-4 list-disc text-sm">{formatInline(line.slice(2))}</li>
        if (/^\d+\.\s/.test(line))
          return <li key={i} className="ml-4 list-decimal text-sm">{formatInline(line.replace(/^\d+\.\s/, ''))}</li>
        if (!line.trim()) return <div key={i} className="h-1" />
        return <p key={i} className="text-sm">{formatInline(line)}</p>
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold">{part}</strong> : part
  )
}

function generateId() {
  return Math.random().toString(36).substring(2, 10)
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

// ---- Status Badge ----

function StatusBadge({ status }: { status: string }) {
  const config = getStatusConfig(status)
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.colorClasses}`}>
      {config.label}
    </span>
  )
}

// ---- Stat Card ----

function StatCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: number; accent: string }) {
  return (
    <Card className="backdrop-blur-md bg-white/75 border border-white/[0.18] shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground font-medium">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---- Skeleton Loader for Email Preview ----

function EmailPreviewSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-5 w-20 mt-4" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-5 w-28 mt-4" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

// ---- Inline Message ----

function InlineMessage({ type, message, onDismiss }: { type: 'success' | 'error' | 'info'; message: string; onDismiss?: () => void }) {
  const colorMap = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  }
  const iconMap = {
    success: <HiOutlineCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />,
    error: <HiOutlineExclamationCircle className="w-4 h-4 text-red-600 flex-shrink-0" />,
    info: <HiOutlineStatusOnline className="w-4 h-4 text-blue-600 flex-shrink-0" />,
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

// ---- Agent Info Panel ----

function AgentInfoPanel({ activeAgentId }: { activeAgentId: string | null }) {
  const agents = [
    { id: AGENT_IDS.outreach, name: 'Outreach Email Generator', purpose: 'Generates personalized donor outreach emails' },
    { id: AGENT_IDS.sender, name: 'Email Sender', purpose: 'Sends emails via Gmail integration' },
    { id: AGENT_IDS.engagement, name: 'Engagement Analyzer', purpose: 'Analyzes engagement from sent outreach' },
    { id: AGENT_IDS.followup, name: 'Follow-Up Composer', purpose: 'Generates context-aware follow-up emails' },
  ]
  return (
    <Card className="backdrop-blur-md bg-white/75 border border-white/[0.18]">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <HiOutlineLightningBolt className="w-4 h-4 text-primary" />
          AI Agents
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          {agents.map((agent) => (
            <div key={agent.id} className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${activeAgentId === agent.id ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span className={`font-medium ${activeAgentId === agent.id ? 'text-foreground' : 'text-muted-foreground'}`}>{agent.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function Page() {
  // ---- Navigation ----
  const [activeScreen, setActiveScreen] = useState<ScreenName>('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showSampleData, setShowSampleData] = useState(true)

  // ---- Leads pipeline ----
  const [leads, setLeads] = useState<Lead[]>(initialSampleLeads)

  // ---- Agent tracking ----
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // ---- Dashboard state ----
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // ---- Compose state ----
  const [composeForm, setComposeForm] = useState<ComposeForm>({
    name: '', organization: '', role: '', interests: '', context: '', givingHistory: '',
  })
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null)
  const [generatingEmail, setGeneratingEmail] = useState(false)
  const [sendingEmail, setSendingEmail] = useState(false)
  const [composeStatus, setComposeStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // ---- Engagement state ----
  const [engagementLeads, setEngagementLeads] = useState<EngagementLead[]>([])
  const [engagementSummary, setEngagementSummary] = useState('')
  const [engagementTotal, setEngagementTotal] = useState(0)
  const [analyzingEngagement, setAnalyzingEngagement] = useState(false)
  const [engagementStatus, setEngagementStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // ---- Follow-ups state ----
  const [followUpForm, setFollowUpForm] = useState<FollowUpForm>({
    leadName: '', organization: '', engagementStatus: '', originalSnippet: '', followupType: 'warm_followup',
  })
  const [followUpPreview, setFollowUpPreview] = useState<FollowUpPreview | null>(null)
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false)
  const [sendingFollowUp, setSendingFollowUp] = useState(false)
  const [followUpStatus, setFollowUpStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // ---- Computed stats ----
  const displayLeads = showSampleData ? leads : leads.filter(l => !initialSampleLeads.find(s => s.id === l.id))
  const totalLeads = displayLeads.length
  const pendingResponse = displayLeads.filter(l => l.status === 'sent' || l.status === 'no_response').length
  const engaged = displayLeads.filter(l => l.status === 'replied' || l.status === 'active_thread').length
  const converted = displayLeads.filter(l => l.status === 'meeting_scheduled').length

  // ---- Filtered leads ----
  const filteredLeads = displayLeads.filter(lead => {
    const matchesSearch = searchQuery === '' ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.organization.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // ---- Compose handlers ----
  const handleGenerateEmail = useCallback(async () => {
    if (!composeForm.name || !composeForm.organization) return
    setGeneratingEmail(true)
    setComposeStatus(null)
    setEmailPreview(null)
    setActiveAgentId(AGENT_IDS.outreach)
    try {
      const message = `Generate a personalized cold outreach email for: Name: ${composeForm.name}, Organization: ${composeForm.organization}, Role: ${composeForm.role}, Interests: ${composeForm.interests}, Context: ${composeForm.context}, Giving History: ${composeForm.givingHistory}`
      const result = await callAIAgent(message, AGENT_IDS.outreach)
      if (result.success) {
        const data = parseAgentResult(result)
        setEmailPreview({
          subject: data?.subject ?? '',
          body: data?.body ?? '',
          toneNotes: data?.tone_notes ?? '',
          recipientEmail: '',
        })
        setComposeStatus({ type: 'success', message: 'Email generated successfully. Review and edit before sending.' })
      } else {
        setComposeStatus({ type: 'error', message: result?.error ?? 'Failed to generate email.' })
      }
    } catch (err) {
      setComposeStatus({ type: 'error', message: 'An unexpected error occurred.' })
    } finally {
      setGeneratingEmail(false)
      setActiveAgentId(null)
    }
  }, [composeForm])

  const handleSendEmail = useCallback(async () => {
    if (!emailPreview?.recipientEmail || !emailPreview?.subject || !emailPreview?.body) {
      setComposeStatus({ type: 'error', message: 'Please fill in recipient email, subject, and body.' })
      return
    }
    setSendingEmail(true)
    setComposeStatus(null)
    setActiveAgentId(AGENT_IDS.sender)
    try {
      const message = `Send an email to ${emailPreview.recipientEmail} with subject: ${emailPreview.subject} and body: ${emailPreview.body}`
      const result = await callAIAgent(message, AGENT_IDS.sender)
      if (result.success) {
        const data = parseAgentResult(result)
        const sendStatus = data?.send_status ?? ''
        if (sendStatus.toLowerCase().includes('fail')) {
          setComposeStatus({ type: 'error', message: data?.error_message ?? 'Email sending failed.' })
        } else {
          setComposeStatus({ type: 'success', message: `Email sent to ${emailPreview.recipientEmail} successfully.` })
          // Add lead to pipeline
          const newLead: Lead = {
            id: generateId(),
            name: composeForm.name,
            organization: composeForm.organization,
            email: emailPreview.recipientEmail,
            status: 'sent',
            lastContactDate: new Date().toISOString().split('T')[0],
            role: composeForm.role,
            interests: composeForm.interests,
            notes: composeForm.context,
          }
          setLeads(prev => [newLead, ...prev])
          // Reset form
          setComposeForm({ name: '', organization: '', role: '', interests: '', context: '', givingHistory: '' })
          setEmailPreview(null)
        }
      } else {
        setComposeStatus({ type: 'error', message: result?.error ?? 'Failed to send email.' })
      }
    } catch (err) {
      setComposeStatus({ type: 'error', message: 'An unexpected error occurred while sending.' })
    } finally {
      setSendingEmail(false)
      setActiveAgentId(null)
    }
  }, [emailPreview, composeForm])

  // ---- Engagement handlers ----
  const handleAnalyzeEngagement = useCallback(async () => {
    setAnalyzingEngagement(true)
    setEngagementStatus(null)
    setActiveAgentId(AGENT_IDS.engagement)
    try {
      const message = 'Analyze my recent sent emails and identify engagement patterns. Check for replies, no-response after 7 days, and active threads.'
      const result = await callAIAgent(message, AGENT_IDS.engagement)
      if (result.success) {
        const data = parseAgentResult(result)
        const leadsData = Array.isArray(data?.leads) ? data.leads : []
        setEngagementLeads(leadsData)
        setEngagementSummary(data?.analysis_summary ?? '')
        setEngagementTotal(typeof data?.total_analyzed === 'number' ? data.total_analyzed : leadsData.length)
        setEngagementStatus({ type: 'success', message: `Analyzed ${typeof data?.total_analyzed === 'number' ? data.total_analyzed : leadsData.length} leads.` })
      } else {
        setEngagementStatus({ type: 'error', message: result?.error ?? 'Failed to analyze engagement.' })
      }
    } catch (err) {
      setEngagementStatus({ type: 'error', message: 'An unexpected error occurred.' })
    } finally {
      setAnalyzingEngagement(false)
      setActiveAgentId(null)
    }
  }, [])

  const handleNavigateToFollowUp = useCallback((lead: EngagementLead) => {
    setFollowUpForm({
      leadName: lead.name ?? '',
      organization: lead.organization ?? '',
      engagementStatus: lead.status ?? '',
      originalSnippet: lead.last_email_snippet ?? '',
      followupType: lead.status === 'no_response_7d' ? 're_engagement' : lead.status === 'replied' ? 'meeting_request' : 'warm_followup',
    })
    setFollowUpPreview(null)
    setFollowUpStatus(null)
    setActiveScreen('followups')
  }, [])

  // ---- Follow-up handlers ----
  const handleGenerateFollowUp = useCallback(async () => {
    if (!followUpForm.leadName) return
    setGeneratingFollowUp(true)
    setFollowUpStatus(null)
    setFollowUpPreview(null)
    setActiveAgentId(AGENT_IDS.followup)
    try {
      const typeLabels: Record<string, string> = {
        warm_followup: 'Warm Follow-Up',
        re_engagement: 'Re-engagement',
        meeting_request: 'Meeting Request',
      }
      const message = `Generate a ${typeLabels[followUpForm.followupType] ?? followUpForm.followupType} follow-up email for: Name: ${followUpForm.leadName}, Organization: ${followUpForm.organization}, Engagement Status: ${followUpForm.engagementStatus}, Original Email: ${followUpForm.originalSnippet}`
      const result = await callAIAgent(message, AGENT_IDS.followup)
      if (result.success) {
        const data = parseAgentResult(result)
        setFollowUpPreview({
          subject: data?.subject ?? '',
          body: data?.body ?? '',
          followupType: data?.followup_type ?? '',
          strategyNotes: data?.strategy_notes ?? '',
          recipientEmail: '',
        })
        setFollowUpStatus({ type: 'success', message: 'Follow-up generated. Review and send.' })
      } else {
        setFollowUpStatus({ type: 'error', message: result?.error ?? 'Failed to generate follow-up.' })
      }
    } catch (err) {
      setFollowUpStatus({ type: 'error', message: 'An unexpected error occurred.' })
    } finally {
      setGeneratingFollowUp(false)
      setActiveAgentId(null)
    }
  }, [followUpForm])

  const handleSendFollowUp = useCallback(async () => {
    if (!followUpPreview?.recipientEmail || !followUpPreview?.subject || !followUpPreview?.body) {
      setFollowUpStatus({ type: 'error', message: 'Please fill in recipient email, subject, and body.' })
      return
    }
    setSendingFollowUp(true)
    setFollowUpStatus(null)
    setActiveAgentId(AGENT_IDS.sender)
    try {
      const message = `Send an email to ${followUpPreview.recipientEmail} with subject: ${followUpPreview.subject} and body: ${followUpPreview.body}`
      const result = await callAIAgent(message, AGENT_IDS.sender)
      if (result.success) {
        const data = parseAgentResult(result)
        const sendStatus = data?.send_status ?? ''
        if (sendStatus.toLowerCase().includes('fail')) {
          setFollowUpStatus({ type: 'error', message: data?.error_message ?? 'Follow-up sending failed.' })
        } else {
          setFollowUpStatus({ type: 'success', message: `Follow-up sent to ${followUpPreview.recipientEmail} successfully.` })
          // Update lead status if matching
          setLeads(prev =>
            prev.map(l =>
              l.email === followUpPreview.recipientEmail || l.name === followUpForm.leadName
                ? { ...l, status: 'followup_sent' as const, lastContactDate: new Date().toISOString().split('T')[0] }
                : l
            )
          )
          setFollowUpForm({ leadName: '', organization: '', engagementStatus: '', originalSnippet: '', followupType: 'warm_followup' })
          setFollowUpPreview(null)
        }
      } else {
        setFollowUpStatus({ type: 'error', message: result?.error ?? 'Failed to send follow-up.' })
      }
    } catch (err) {
      setFollowUpStatus({ type: 'error', message: 'An unexpected error occurred while sending.' })
    } finally {
      setSendingFollowUp(false)
      setActiveAgentId(null)
    }
  }, [followUpPreview, followUpForm.leadName])

  // ---- Navigation items ----
  const navItems: { id: ScreenName; icon: React.ReactNode; label: string }[] = [
    { id: 'dashboard', icon: <HiOutlineViewGrid className="w-5 h-5" />, label: 'Dashboard' },
    { id: 'compose', icon: <HiOutlineMail className="w-5 h-5" />, label: 'Compose Outreach' },
    { id: 'engagement', icon: <HiOutlineChartBar className="w-5 h-5" />, label: 'Engagement Tracker' },
    { id: 'followups', icon: <HiOutlineRefresh className="w-5 h-5" />, label: 'Follow-Ups' },
  ]

  // ---- Render ----
  return (
    <ErrorBoundary>
      <div style={THEME_VARS} className="min-h-screen bg-background text-foreground font-sans" >
        <div className="flex min-h-screen" style={{ background: 'linear-gradient(135deg, hsl(160 40% 94%) 0%, hsl(180 35% 93%) 30%, hsl(160 35% 95%) 60%, hsl(140 40% 94%) 100%)' }}>
          {/* ===== SIDEBAR ===== */}
          <aside className={`flex-shrink-0 flex flex-col border-r border-border bg-white/60 backdrop-blur-md transition-all duration-300 ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
            {/* Logo */}
            <div className="p-4 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <HiOutlinePaperAirplane className="w-4 h-4 text-white rotate-45" />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-base font-semibold text-foreground tracking-tight leading-tight">ImpactReach</h1>
                  <p className="text-[10px] text-muted-foreground leading-tight">Donor Outreach Automation</p>
                </div>
              )}
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-2 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveScreen(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${activeScreen === item.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </nav>

            {/* Agent info panel */}
            {!sidebarCollapsed && (
              <div className="p-3">
                <AgentInfoPanel activeAgentId={activeAgentId} />
              </div>
            )}

            {/* Donate button */}
            <div className={`px-3 ${sidebarCollapsed ? 'flex justify-center' : ''}`}>
              <a
                href="https://GoFundMe.me/3f8fbf1b2"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600 shadow-md shadow-rose-500/20 ${sidebarCollapsed ? 'justify-center px-2' : 'w-full'}`}
                title="Support Our Mission"
              >
                <HiOutlineHeart className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>Donate to Our Cause</span>}
              </a>
            </div>

            {/* Collapse toggle */}
            <div className="p-3 border-t border-border">
              <button
                onClick={() => setSidebarCollapsed(prev => !prev)}
                className="w-full flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              >
                {sidebarCollapsed ? <HiOutlineChevronRight className="w-4 h-4" /> : <HiOutlineChevronLeft className="w-4 h-4" />}
              </button>
            </div>
          </aside>

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 overflow-y-auto">
            {/* Top bar */}
            <div className="sticky top-0 z-10 backdrop-blur-md bg-white/60 border-b border-border px-6 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                {navItems.find(n => n.id === activeScreen)?.label ?? 'Dashboard'}
              </h2>
              <div className="flex items-center gap-3">
                <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground cursor-pointer">Sample Data</Label>
                <Switch id="sample-toggle" checked={showSampleData} onCheckedChange={setShowSampleData} />
              </div>
            </div>

            <div className="p-6">
              {/* ===== DASHBOARD SCREEN ===== */}
              {activeScreen === 'dashboard' && (
                <div className="space-y-6">
                  {/* Stats row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={<HiOutlineUser className="w-5 h-5 text-primary" />} label="Total Leads" value={totalLeads} accent="bg-primary/10" />
                    <StatCard icon={<HiOutlineClock className="w-5 h-5 text-amber-600" />} label="Pending Response" value={pendingResponse} accent="bg-amber-50" />
                    <StatCard icon={<HiOutlineStatusOnline className="w-5 h-5 text-blue-600" />} label="Engaged" value={engaged} accent="bg-blue-50" />
                    <StatCard icon={<HiOutlineBadgeCheck className="w-5 h-5 text-emerald-600" />} label="Converted" value={converted} accent="bg-emerald-50" />
                  </div>

                  {/* Action bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search leads by name or organization..."
                        className="pl-9 bg-white/70 border-border"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 text-sm rounded-xl border border-border bg-white/70 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="all">All Statuses</option>
                      <option value="sent">Sent</option>
                      <option value="replied">Replied</option>
                      <option value="no_response">No Response</option>
                      <option value="active_thread">Active Thread</option>
                      <option value="followup_sent">Follow-Up Sent</option>
                      <option value="meeting_scheduled">Meeting Scheduled</option>
                    </select>
                    <Button onClick={() => setActiveScreen('compose')} className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20">
                      <HiOutlinePlus className="w-4 h-4" />
                      New Outreach
                    </Button>
                  </div>

                  {/* Lead table */}
                  <Card className="backdrop-blur-md bg-white/75 border border-white/[0.18] overflow-hidden">
                    <ScrollArea className="w-full">
                      <div className="min-w-[700px]">
                        <div className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_0.8fr] gap-4 px-5 py-3 border-b border-border bg-secondary/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          <span>Name</span>
                          <span>Organization</span>
                          <span>Status</span>
                          <span>Last Contact</span>
                          <span>Actions</span>
                        </div>
                        {filteredLeads.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <HiOutlineInbox className="w-10 h-10 mb-3 opacity-50" />
                            <p className="text-sm font-medium">No leads found</p>
                            <p className="text-xs mt-1">Start by composing your first outreach email</p>
                          </div>
                        ) : (
                          filteredLeads.map((lead) => (
                            <div key={lead.id} className="grid grid-cols-[1.5fr_1.5fr_1fr_1fr_0.8fr] gap-4 px-5 py-3.5 border-b border-border/50 items-center hover:bg-white/40 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-foreground">{lead.name}</p>
                                <p className="text-xs text-muted-foreground">{lead.role ?? lead.email}</p>
                              </div>
                              <div>
                                <p className="text-sm text-foreground">{lead.organization}</p>
                              </div>
                              <div>
                                <StatusBadge status={lead.status} />
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">{lead.lastContactDate}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setFollowUpForm({
                                      leadName: lead.name,
                                      organization: lead.organization,
                                      engagementStatus: lead.status,
                                      originalSnippet: lead.notes ?? '',
                                      followupType: lead.status === 'no_response' ? 're_engagement' : 'warm_followup',
                                    })
                                    setFollowUpPreview(null)
                                    setFollowUpStatus(null)
                                    setActiveScreen('followups')
                                  }}
                                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                  title="Follow-Up"
                                >
                                  <HiOutlineRefresh className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              )}

              {/* ===== COMPOSE SCREEN ===== */}
              {activeScreen === 'compose' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left - Donor Form */}
                  <Card className="backdrop-blur-md bg-white/75 border border-white/[0.18]">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <HiOutlineUser className="w-5 h-5 text-primary" />
                        Donor / Founder Profile
                      </CardTitle>
                      <CardDescription className="text-xs">Enter details to generate a personalized outreach email.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="c-name" className="text-xs font-medium">Name <span className="text-red-500">*</span></Label>
                        <Input id="c-name" placeholder="e.g. Sarah Chen" value={composeForm.name} onChange={(e) => setComposeForm(prev => ({ ...prev, name: e.target.value }))} className="bg-white/70" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="c-org" className="text-xs font-medium">Organization <span className="text-red-500">*</span></Label>
                        <Input id="c-org" placeholder="e.g. Impact Foundation" value={composeForm.organization} onChange={(e) => setComposeForm(prev => ({ ...prev, organization: e.target.value }))} className="bg-white/70" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="c-role" className="text-xs font-medium">Role / Title</Label>
                        <Input id="c-role" placeholder="e.g. Director of Giving" value={composeForm.role} onChange={(e) => setComposeForm(prev => ({ ...prev, role: e.target.value }))} className="bg-white/70" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="c-interests" className="text-xs font-medium">Interests / Focus Areas</Label>
                        <Input id="c-interests" placeholder="e.g. Education reform, poverty alleviation" value={composeForm.interests} onChange={(e) => setComposeForm(prev => ({ ...prev, interests: e.target.value }))} className="bg-white/70" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="c-context" className="text-xs font-medium">Context Notes</Label>
                        <Textarea id="c-context" placeholder="Any relevant context about this donor..." value={composeForm.context} onChange={(e) => setComposeForm(prev => ({ ...prev, context: e.target.value }))} rows={3} className="bg-white/70" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="c-giving" className="text-xs font-medium">Giving History (optional)</Label>
                        <Input id="c-giving" placeholder="e.g. $50K to education nonprofits in 2025" value={composeForm.givingHistory} onChange={(e) => setComposeForm(prev => ({ ...prev, givingHistory: e.target.value }))} className="bg-white/70" />
                      </div>

                      <Button
                        onClick={handleGenerateEmail}
                        disabled={generatingEmail || !composeForm.name || !composeForm.organization}
                        className="w-full bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20"
                      >
                        {generatingEmail ? (
                          <>
                            <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <HiOutlineSparkles className="w-4 h-4" />
                            Generate Email
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Right - Email Preview */}
                  <Card className="backdrop-blur-md bg-white/75 border border-white/[0.18]">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <HiOutlineMail className="w-5 h-5 text-primary" />
                        Email Preview
                      </CardTitle>
                      <CardDescription className="text-xs">Review, edit, and send the generated email.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {composeStatus && (
                        <InlineMessage type={composeStatus.type} message={composeStatus.message} onDismiss={() => setComposeStatus(null)} />
                      )}

                      {generatingEmail ? (
                        <EmailPreviewSkeleton />
                      ) : emailPreview ? (
                        <>
                          {/* Tone notes */}
                          {emailPreview.toneNotes && (
                            <div className="p-3 rounded-xl bg-secondary/60 border border-border">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Tone Notes</p>
                              <p className="text-xs text-foreground">{emailPreview.toneNotes}</p>
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <Label htmlFor="ep-recipient" className="text-xs font-medium">Recipient Email <span className="text-red-500">*</span></Label>
                            <Input id="ep-recipient" type="email" placeholder="recipient@example.com" value={emailPreview.recipientEmail} onChange={(e) => setEmailPreview(prev => prev ? ({ ...prev, recipientEmail: e.target.value }) : null)} className="bg-white/70" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="ep-subject" className="text-xs font-medium">Subject <span className="text-red-500">*</span></Label>
                            <Input id="ep-subject" value={emailPreview.subject} onChange={(e) => setEmailPreview(prev => prev ? ({ ...prev, subject: e.target.value }) : null)} className="bg-white/70" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="ep-body" className="text-xs font-medium">Body <span className="text-red-500">*</span></Label>
                            <Textarea id="ep-body" value={emailPreview.body} onChange={(e) => setEmailPreview(prev => prev ? ({ ...prev, body: e.target.value }) : null)} rows={12} className="bg-white/70 text-sm" />
                          </div>

                          <Button
                            onClick={handleSendEmail}
                            disabled={sendingEmail || !emailPreview.recipientEmail || !emailPreview.subject || !emailPreview.body}
                            className="w-full bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20"
                          >
                            {sendingEmail ? (
                              <>
                                <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <HiOutlinePaperAirplane className="w-4 h-4 rotate-45" />
                                Send Email
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <HiOutlineMail className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm font-medium">No email generated yet</p>
                          <p className="text-xs mt-1 text-center max-w-xs">Fill in the donor profile on the left and click "Generate Email" to create a personalized outreach message.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ===== ENGAGEMENT TRACKER SCREEN ===== */}
              {activeScreen === 'engagement' && (
                <div className="space-y-6">
                  {/* Action bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Analyze engagement signals from your sent outreach emails via Gmail.</p>
                    </div>
                    <Button
                      onClick={handleAnalyzeEngagement}
                      disabled={analyzingEngagement}
                      className="bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20"
                    >
                      {analyzingEngagement ? (
                        <>
                          <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <HiOutlineChartBar className="w-4 h-4" />
                          Analyze Engagement
                        </>
                      )}
                    </Button>
                  </div>

                  {engagementStatus && (
                    <InlineMessage type={engagementStatus.type} message={engagementStatus.message} onDismiss={() => setEngagementStatus(null)} />
                  )}

                  {/* Summary */}
                  {engagementSummary && (
                    <Card className="backdrop-blur-md bg-white/75 border border-white/[0.18]">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <HiOutlineChartBar className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Analysis Summary ({engagementTotal} leads analyzed)</p>
                            <div className="text-sm text-foreground">{renderMarkdown(engagementSummary)}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Engagement cards */}
                  {analyzingEngagement ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="backdrop-blur-md bg-white/75 border border-white/[0.18]">
                          <CardContent className="p-5 space-y-3">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-8 w-full mt-2" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : engagementLeads.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {engagementLeads.map((lead, index) => (
                        <Card key={`${lead.email ?? ''}-${index}`} className="backdrop-blur-md bg-white/75 border border-white/[0.18] hover:shadow-md transition-shadow">
                          <CardContent className="p-5 space-y-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{lead.name ?? 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{lead.organization ?? ''}</p>
                              </div>
                              <StatusBadge status={lead.status ?? 'unknown'} />
                            </div>

                            {lead.email && (
                              <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                            )}

                            {typeof lead.days_since_contact === 'number' && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <HiOutlineClock className="w-3.5 h-3.5" />
                                <span>{lead.days_since_contact} days since last contact</span>
                              </div>
                            )}

                            {lead.last_email_snippet && (
                              <div className="p-2.5 rounded-lg bg-secondary/50 border border-border/50">
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Last Email</p>
                                <p className="text-xs text-foreground line-clamp-3">{lead.last_email_snippet}</p>
                              </div>
                            )}

                            {lead.thread_summary && (
                              <div>
                                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Thread Summary</p>
                                <p className="text-xs text-foreground line-clamp-2">{lead.thread_summary}</p>
                              </div>
                            )}

                            <Button
                              onClick={() => handleNavigateToFollowUp(lead)}
                              variant="outline"
                              size="sm"
                              className="w-full mt-2 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/5"
                            >
                              <HiOutlineRefresh className="w-3.5 h-3.5" />
                              Generate Follow-Up
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : !analyzingEngagement && engagementLeads.length === 0 && !engagementSummary ? (
                    <Card className="backdrop-blur-md bg-white/75 border border-white/[0.18]">
                      <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <HiOutlineInbox className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm font-medium">No engagement data yet</p>
                        <p className="text-xs mt-1 text-center max-w-sm">Click "Analyze Engagement" to scan your Gmail for replies and engagement signals from sent outreach.</p>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              )}

              {/* ===== FOLLOW-UPS SCREEN ===== */}
              {activeScreen === 'followups' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left - Lead Context & Form */}
                  <Card className="backdrop-blur-md bg-white/75 border border-white/[0.18]">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <HiOutlineRefresh className="w-5 h-5 text-primary" />
                        Follow-Up Context
                      </CardTitle>
                      <CardDescription className="text-xs">Provide context about the lead for a tailored follow-up email.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="fu-name" className="text-xs font-medium">Lead Name <span className="text-red-500">*</span></Label>
                        <Input id="fu-name" placeholder="e.g. Sarah Chen" value={followUpForm.leadName} onChange={(e) => setFollowUpForm(prev => ({ ...prev, leadName: e.target.value }))} className="bg-white/70" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="fu-org" className="text-xs font-medium">Organization</Label>
                        <Input id="fu-org" placeholder="e.g. Impact Foundation" value={followUpForm.organization} onChange={(e) => setFollowUpForm(prev => ({ ...prev, organization: e.target.value }))} className="bg-white/70" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="fu-status" className="text-xs font-medium">Engagement Status</Label>
                        <Input id="fu-status" placeholder="e.g. Replied, No Response 7d+" value={followUpForm.engagementStatus} onChange={(e) => setFollowUpForm(prev => ({ ...prev, engagementStatus: e.target.value }))} className="bg-white/70" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="fu-snippet" className="text-xs font-medium">Original Email Snippet</Label>
                        <Textarea id="fu-snippet" placeholder="Paste relevant snippet from the original outreach or reply..." value={followUpForm.originalSnippet} onChange={(e) => setFollowUpForm(prev => ({ ...prev, originalSnippet: e.target.value }))} rows={4} className="bg-white/70" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="fu-type" className="text-xs font-medium">Follow-Up Type</Label>
                        <select
                          id="fu-type"
                          value={followUpForm.followupType}
                          onChange={(e) => setFollowUpForm(prev => ({ ...prev, followupType: e.target.value as FollowUpForm['followupType'] }))}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-white/70 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          <option value="warm_followup">Warm Follow-Up</option>
                          <option value="re_engagement">Re-engagement</option>
                          <option value="meeting_request">Meeting Request</option>
                        </select>
                      </div>

                      {/* Visual engagement timeline */}
                      {followUpForm.leadName && (
                        <div className="p-3 rounded-xl bg-secondary/60 border border-border">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Engagement Timeline</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                              <span className="text-[10px] text-muted-foreground">Sent</span>
                            </div>
                            <div className="flex-1 h-px bg-border" />
                            <div className="flex items-center gap-1.5">
                              <div className={`w-2.5 h-2.5 rounded-full ${followUpForm.engagementStatus?.includes('replied') || followUpForm.engagementStatus?.includes('active') ? 'bg-green-400' : 'bg-gray-300'}`} />
                              <span className="text-[10px] text-muted-foreground">Response</span>
                            </div>
                            <div className="flex-1 h-px bg-border" />
                            <div className="flex items-center gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                              <span className="text-[10px] text-muted-foreground font-medium">Follow-Up</span>
                            </div>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleGenerateFollowUp}
                        disabled={generatingFollowUp || !followUpForm.leadName}
                        className="w-full bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20"
                      >
                        {generatingFollowUp ? (
                          <>
                            <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <HiOutlineSparkles className="w-4 h-4" />
                            Generate Follow-Up
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Right - Follow-Up Preview */}
                  <Card className="backdrop-blur-md bg-white/75 border border-white/[0.18]">
                    <CardHeader>
                      <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <HiOutlineMail className="w-5 h-5 text-primary" />
                        Follow-Up Preview
                      </CardTitle>
                      <CardDescription className="text-xs">Review, edit, and send the follow-up email.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {followUpStatus && (
                        <InlineMessage type={followUpStatus.type} message={followUpStatus.message} onDismiss={() => setFollowUpStatus(null)} />
                      )}

                      {generatingFollowUp ? (
                        <EmailPreviewSkeleton />
                      ) : followUpPreview ? (
                        <>
                          {/* Strategy notes */}
                          {followUpPreview.strategyNotes && (
                            <div className="p-3 rounded-xl bg-secondary/60 border border-border">
                              <p className="text-xs text-muted-foreground font-medium mb-1">Strategy Notes</p>
                              <p className="text-xs text-foreground">{followUpPreview.strategyNotes}</p>
                            </div>
                          )}

                          {/* Follow-up type */}
                          {followUpPreview.followupType && (
                            <div className="flex items-center gap-2">
                              <HiOutlineTag className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Type:</span>
                              <StatusBadge status={followUpPreview.followupType} />
                            </div>
                          )}

                          <div className="space-y-1.5">
                            <Label htmlFor="fup-recipient" className="text-xs font-medium">Recipient Email <span className="text-red-500">*</span></Label>
                            <Input id="fup-recipient" type="email" placeholder="recipient@example.com" value={followUpPreview.recipientEmail} onChange={(e) => setFollowUpPreview(prev => prev ? ({ ...prev, recipientEmail: e.target.value }) : null)} className="bg-white/70" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="fup-subject" className="text-xs font-medium">Subject <span className="text-red-500">*</span></Label>
                            <Input id="fup-subject" value={followUpPreview.subject} onChange={(e) => setFollowUpPreview(prev => prev ? ({ ...prev, subject: e.target.value }) : null)} className="bg-white/70" />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="fup-body" className="text-xs font-medium">Body <span className="text-red-500">*</span></Label>
                            <Textarea id="fup-body" value={followUpPreview.body} onChange={(e) => setFollowUpPreview(prev => prev ? ({ ...prev, body: e.target.value }) : null)} rows={12} className="bg-white/70 text-sm" />
                          </div>

                          <Button
                            onClick={handleSendFollowUp}
                            disabled={sendingFollowUp || !followUpPreview.recipientEmail || !followUpPreview.subject || !followUpPreview.body}
                            className="w-full bg-primary hover:bg-primary/90 text-white gap-2 shadow-md shadow-primary/20"
                          >
                            {sendingFollowUp ? (
                              <>
                                <HiOutlineRefresh className="w-4 h-4 animate-spin" />
                                Sending...
                              </>
                            ) : (
                              <>
                                <HiOutlinePaperAirplane className="w-4 h-4 rotate-45" />
                                Send Follow-Up
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <HiOutlineRefresh className="w-10 h-10 mb-3 opacity-30" />
                          <p className="text-sm font-medium">No follow-up generated yet</p>
                          <p className="text-xs mt-1 text-center max-w-xs">Enter the lead context on the left and click "Generate Follow-Up" to create a tailored follow-up email.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  )
}
