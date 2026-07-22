"use client";

import { useApp } from "@/components/providers/app-provider";
import { createLookups, filterPositions } from "@/lib/data/selectors";
import {
  SectionPageLayout,
  SectionTable,
  SectionRow,
  SectionEmpty,
} from "@/components/dashboard/section-layout";

export default function ClientsPage() {
  const { state, activeFilters } = useApp();

  if (!state) {
    return null;
  }

  const lookups = createLookups(state);
  const positions = filterPositions(state, activeFilters);

  return (
    <SectionPageLayout
      title="Clients"
      accent="blue"
      eyebrow="Client Overview"
      description="Client workload, open roles, and pipeline metrics at a glance."
      count={state.clients.length}
      countLabel="clients"
    >
      <SectionTable
        headers={[
          { label: "Client" },
          { label: "Industry" },
          { label: "Positions" },
          { label: "Active" },
          { label: "CV" },
          { label: "Interviews" },
          { label: "Offers" },
          { label: "Joined" },
        ]}
        accent="blue"
      >
        {state.clients.map((client) => {
          const clientPositions = positions.filter((position) => position.clientId === client.id);
          const clientCandidates = state.candidates.filter((candidate) => candidate.clientId === client.id);
          const clientInterviews = state.interviews.filter((interview) => interview.clientId === client.id);
          const clientOffers = state.offers.filter((offer) => offer.clientId === client.id);
          const clientJoinings = state.joinings.filter((joining) => joining.clientId === client.id);

          return (
            <SectionRow key={client.id} accent="blue">
              <td className="border-b border-slate-100 px-4 py-3.5">
                <div className="font-medium text-slate-950">{client.name}</div>
                <div className="text-xs text-slate-500">{lookups.recruiters.get(client.ownerRecruiterId)?.name}</div>
              </td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-600">{client.industry}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{state.positions.filter((position) => position.clientId === client.id).length}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{clientPositions.filter((position) => position.status !== "Closed").length}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{clientCandidates.length}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{clientInterviews.length}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{clientOffers.length}</td>
              <td className="border-b border-slate-100 px-4 py-3.5 text-slate-700">{clientJoinings.filter((joining) => joining.status === "Joined").length}</td>
            </SectionRow>
          );
        })}
        {state.clients.length === 0 && <SectionEmpty colSpan={8} message="No clients found" />}
      </SectionTable>
    </SectionPageLayout>
  );
}
