"use client";

import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  EmptyState,
  Input,
  Modal,
  Pagination,
  Select,
  Spinner,
  Table,
  Tbody,
  Td,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
} from "@/components/ui";

export function UiShowcase() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-col gap-2">
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          Dev only
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Showcase UI Admin
        </h1>
        <p className="max-w-2xl text-muted">
          Primitives réutilisables (`src/components/ui`). Route disponible
          uniquement hors production.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primaire</Button>
          <Button variant="secondary">Secondaire</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button
            onClick={() =>
              toast({
                title: "Enregistré",
                description: "Toast de démonstration.",
                tone: "success",
              })
            }
          >
            Toast
          </Button>
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Ouvrir modal
          </Button>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Formulaires</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span>Nom</span>
            <Input placeholder="Agence Kinshasa" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span>Type</span>
            <Select defaultValue="office">
              <option value="office">Bureau</option>
              <option value="warehouse">Entrepôt</option>
              <option value="mixed">Mixte</option>
            </Select>
          </label>
          <label className="flex flex-col gap-1 text-sm md:col-span-2">
            <span>Notes</span>
            <Textarea placeholder="Commentaire interne…" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked />
            <span>Actif</span>
          </label>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Feedback</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutre</Badge>
          <Badge tone="primary">Primary</Badge>
          <Badge tone="success">OK</Badge>
          <Badge tone="warning">Attention</Badge>
          <Badge tone="danger">Erreur</Badge>
        </div>
        <Alert tone="info" title="Information">
          Les tokens CSS sont définis dans `globals.css`.
        </Alert>
        <Alert tone="danger" title="Erreur API">
          Exemple de message statusCode / message / error.
        </Alert>
        <Spinner />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Table & pagination</h2>
        <Table>
          <Thead>
            <Tr>
              <Th>Code</Th>
              <Th>Nom</Th>
              <Th>Statut</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>KIN</Td>
              <Td>Kinshasa</Td>
              <Td>
                <Badge tone="success">Actif</Badge>
              </Td>
            </Tr>
            <Tr>
              <Td>LUB</Td>
              <Td>Lubumbashi</Td>
              <Td>
                <Badge tone="warning">Suspendu</Badge>
              </Td>
            </Tr>
          </Tbody>
        </Table>
        <Pagination
          page={page}
          pageSize={10}
          total={42}
          onPageChange={setPage}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Empty state</h2>
        <EmptyState
          title="Aucun utilisateur"
          description="Invitez un collaborateur pour commencer."
          action={<Button size="sm">Inviter</Button>}
        />
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Confirmation"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => setOpen(false)}>Confirmer</Button>
          </>
        }
      >
        <p className="text-muted">
          Exemple de dialogue modal pour les confirmations admin.
        </p>
      </Modal>
    </div>
  );
}
