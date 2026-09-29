'use client'

import React from 'react'
import { Cpu, MapPin, Plus, RefreshCw, Terminal } from 'lucide-react'
import { RocketMachine } from '@/lib/types'

interface InfrastructureSectionProps {
  machines: RocketMachine[]
  onOpenLaunchModal: () => void
  onRefresh: () => void
  onConnectMachine: (machine: RocketMachine) => void
}

export default function InfrastructureSection({
  machines,
  onOpenLaunchModal,
  onRefresh,
  onConnectMachine,
}: InfrastructureSectionProps) {
  const statusClassName = (status: RocketMachine['status']) =>
    `infrastructure-status infrastructure-status--${status.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <>
      <div className="view-header">
        <div>
          <h2>Infrastructure & Orbital Machines</h2>
          <p>Manage space microservers, compute nodes, and payload instances.</p>
        </div>
        <button className="primary-btn" onClick={onOpenLaunchModal} type="button">
          <Plus style={{ width: 16 }} /> Launch Instance
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <div className="table-head-row">
          <h3>Active Rocket Instances ({machines.length})</h3>
          <button className="secondary-btn" onClick={onRefresh} type="button">
            <RefreshCw style={{ width: 14 }} /> Refresh
          </button>
        </div>

        <div className="infrastructure-table-wrap">
          <table className="infrastructure-table">
            <thead>
              <tr>
                <th>Instance</th>
                <th>Mission</th>
                <th>Region</th>
                <th>Compute</th>
                <th>Network endpoint</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {machines.map((machine) => (
                <tr key={machine.id}>
                  <td data-label="Instance">
                    <div className="instance-identity">
                      <span className="instance-mark" aria-hidden="true">
                        <Cpu size={17} />
                      </span>
                      <div>
                        <strong>{machine.name}</strong>
                        <span>{machine.image}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Mission" className="infrastructure-mission">{machine.mission}</td>
                  <td data-label="Region">
                    <span className="region-value"><MapPin size={15} />{machine.region}</span>
                  </td>
                  <td data-label="Compute">
                    <div className="compute-value">
                      <strong>{machine.cpu}</strong>
                      <span>{machine.memory}</span>
                    </div>
                  </td>
                  <td data-label="Network endpoint"><code>{machine.ip}</code></td>
                  <td data-label="Status"><span className={statusClassName(machine.status)}>{machine.status}</span></td>
                  <td className="infrastructure-action-cell">
                    <button
                      className="infrastructure-connect-btn"
                      onClick={() => onConnectMachine(machine)}
                      type="button"
                    >
                      <Terminal size={15} />
                      <span>Connect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {machines.length === 0 && (
            <p className="infrastructure-empty-state">No active instances yet. Launch one to begin.</p>
          )}
        </div>
      </div>
    </>
  )
}
