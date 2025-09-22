'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { Form as BootstrapForm, Button, Table, Spinner, Alert } from 'react-bootstrap';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

interface Row {
  row: string;
  availableSeats: number;
  totalSeats: number;
  bookedSeats: number;
}

interface Section {
  section: string;
  rows: Row[];
}

interface AvailabilityResponse {
  eventId: string;
  eventName: string;
  availability: Section[];
}

interface PurchaseResponse {
  message: string;
  section: string;
  row: string;
  purchasedQuantity: number;
  groupDiscount: boolean;
  remainingSeats: number;
}

interface FormValues {
  sectionName: string;
  rowName: string;
  quantity: number;
}

const API_BASE_URL = 'http://localhost:8888';

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [availability, setAvailability] = useState<Section[]>([]);
  const [eventName, setEventName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PurchaseResponse | null>(null);
  const [discountApplied, setDiscountApplied] = useState<boolean>(false);

  // Fetch availability from API using Axios
  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await axios.get<AvailabilityResponse>(`${API_BASE_URL}/events/${id}/availability`);
      if (!response.data.availability) throw new Error('No availability data');
      setAvailability(response.data.availability);
      setEventName(response.data.eventName);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [id]);

  // Yup validation schema with dynamic max quantity based on available seats
  const validationSchema = Yup.object({
    sectionName: Yup.string().required('Section is required'),
    rowName: Yup.string().required('Row is required'),
    quantity: Yup.number()
      .required('Quantity is required')
      .min(1, 'Quantity must be at least 1')
      .when(['sectionName', 'rowName'], {
        is: (sectionName: string, rowName: string) => sectionName && rowName,
        then: (schema) =>
          schema.test({
            name: 'max-available',
            message: 'Quantity exceeds available seats',
            test: function (value: number) {
              const { sectionName, rowName } = this.parent;
              const selectedSection = availability.find((s) => s.section === sectionName);
              const selectedRow = selectedSection?.rows.find((r) => r.row === rowName);
              const available = selectedRow?.availableSeats ?? 0;
              return value <= available;
            },
          }),
      }),
  });

  const initialValues: FormValues = {
    sectionName: '',
    rowName: '',
    quantity: 1,
  };

  const handleSubmit = async (values: FormValues, { setSubmitting, resetForm }: any) => {
    setError(null);
    setSuccess(null);
    setDiscountApplied(false);

    try {
      const response = await axios.post<PurchaseResponse>(`${API_BASE_URL}/events/${id}/purchase`, {
        sectionName: values.sectionName,
        rowName: values.rowName,
        quantity: values.quantity,
      });
      if (!response.data) throw new Error('Purchase failed');
      setSuccess(response.data);
      if (response.data.groupDiscount) setDiscountApplied(true);
      fetchAvailability(); // Refresh availability after purchase
      resetForm(); // Reset form after success
    } catch (err: unknown) {
      setError((err as Error).message || 'Purchase failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;

  return (
    <div className="mt-4">
      <h2>{eventName} Availability</h2>
      {error && <Alert variant="danger" className="error-msg">{error}</Alert>}
      {success && (
        <Alert variant="success" className="success-msg">
          {success.message}
          <br />
          Purchased: {success.purchasedQuantity} ticket(s) in {success.section}, {success.row}.
          <br />
          Remaining Seats: {success.remainingSeats}
        </Alert>
      )}
      {discountApplied && <p className="discount-msg">Group Discount Applied!</p>}

      <Table striped bordered hover className="availability-table">
        <thead>
          <tr>
            <th>Section</th>
            <th>Row</th>
            <th>Total Seats</th>
            <th>Available Seats</th>
            <th>Booked Seats</th>
          </tr>
        </thead>
        <tbody>
          {availability.map((section) =>
            section.rows.map((row) => (
              <tr key={`${section.section}-${row.row}`}>
                <td>{section.section}</td>
                <td>{row.row}</td>
                <td>{row.totalSeats}</td>
                <td>{row.availableSeats}</td>
                <td>{row.bookedSeats}</td>
              </tr>
            ))
          )}
        </tbody>
      </Table>

      <h3 className="mt-4">Book Tickets</h3>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting, setFieldValue }) => (
          <Form>
            <BootstrapForm.Group className="mb-3">
              <BootstrapForm.Label htmlFor="sectionName">Section</BootstrapForm.Label>
              <Field as="select" id="sectionName" name="sectionName" className="form-select">
                <option value="">Select Section</option>
                {availability.map((section) => (
                  <option key={section.section} value={section.section}>
                    {section.section}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="sectionName" component="div" className="text-danger" />
            </BootstrapForm.Group>

            <BootstrapForm.Group className="mb-3">
              <BootstrapForm.Label htmlFor="rowName">Row</BootstrapForm.Label>
              <Field
                as="select"
                id="rowName"
                name="rowName"
                className="form-select"
                disabled={!values.sectionName}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setFieldValue('rowName', e.target.value);
                  setFieldValue('quantity', 1); // Reset quantity on row change
                }}
              >
                <option value="">Select Row</option>
                {availability
                  .find((s) => s.section === values.sectionName)?.rows.map((row) => (
                    <option key={row.row} value={row.row}>
                      {row.row} (Available: {row.availableSeats})
                    </option>
                  ))}
              </Field>
              <ErrorMessage name="rowName" component="div" className="text-danger" />
            </BootstrapForm.Group>

            <BootstrapForm.Group className="mb-3">
              <BootstrapForm.Label htmlFor="quantity">Number of Tickets</BootstrapForm.Label>
              <Field
                type="number"
                id="quantity"
                name="quantity"
                className="form-control"
                min="1"
              />
              <ErrorMessage name="quantity" component="div" className="text-danger" />
            </BootstrapForm.Group>

            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Purchasing...' : 'Purchase Tickets'}
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}