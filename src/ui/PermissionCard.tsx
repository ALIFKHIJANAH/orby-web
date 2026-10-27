import { motion } from 'motion/react'
import { LogoBadge, Orb } from '../orb/Orb'
import type { AgentId } from '../orb/agents'
import { Alert, Branch, Shield, Terminal } from './icons'
import './permission.css'

export interface Request {
  id: string
  agent: AgentId
  title: string
  task: string
  project: string
  branch: string
  risk?: string
  command: string
  rule?: string
}

/** The app's approval card, rebuilt in HTML so it can actually be answered. */
export function PermissionCard({
  req,
  pressed,
  onAllow,
  onDeny,
  position,
  compact,
}: {
  req: Request
  pressed?: 'allow' | 'deny' | null
  onAllow?: () => void
  onDeny?: () => void
  position?: string
  compact?: boolean
}) {
  return (
    <div className={`perm${req.risk ? ' risky' : ''}${compact ? ' compact' : ''}`}>
      <div className="perm-head">
        <span className="perm-orb">
          <Orb phase="needs" agent={req.agent} size={compact ? 26 : 32} />
          <span className="perm-badge">
            <LogoBadge agent={req.agent} size={compact ? 12 : 14} />
          </span>
        </span>
        <div className="perm-title">
          <strong>{req.title}</strong>
          <span className="perm-meta">
            <span className="ellipsis">{req.task}</span>
            <span>·</span>
            <span>{req.project}</span>
            <span className="perm-branch">
              <Branch size={11} />
              {req.branch}
            </span>
            {!compact && <span>· waiting just now</span>}
          </span>
        </div>
        {position && <span className="perm-pos">{position}</span>}
      </div>
      {req.risk && (
        <span className="perm-risk">
          <Alert size={14} />
          {req.risk}
        </span>
      )}
      <code className="perm-cmd">
        <span aria-hidden>$ </span>
        {req.command}
      </code>
      <div className="perm-actions">
        {!compact && (
          <span className="perm-terminal">
            <Terminal size={15} />
            Answer in Terminal
          </span>
        )}
        <motion.button className="perm-btn deny" onClick={onDeny} animate={pressed === 'deny' ? { scale: [1, 0.92, 1] } : {}}>
          Deny <span className="kbd">⌘N</span>
        </motion.button>
        {!compact && <button className="perm-btn always">Always allow</button>}
        <motion.button className="perm-btn allow" onClick={onAllow} animate={pressed === 'allow' ? { scale: [1, 0.92, 1] } : {}}>
          Allow <span className="kbd">⌘Y</span>
        </motion.button>
      </div>
      {!compact && req.rule && <p className="perm-foot">Always allow adds the rule {req.rule}, so it won't ask again for it.</p>}
      {!compact && (
        <p className="perm-trust">
          <Shield size={14} />
          Allow, and trust this session for 30 min
        </p>
      )}
    </div>
  )
}
