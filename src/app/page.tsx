'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, Button, Row, Col, Spinner, Alert, Modal, Form as BootstrapForm } from 'react-bootstrap';
import axios from 'axios';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';

interface Row {
  name: string;
  totalSeats: number;
  bookedSeats?: number;
}

interface Section {
  name: string;
  rows: Row[];
}

interface Event {
  _id: string;
  name: string;
  sections: Section[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface EventsResponse {
  message: string;
  event: Event[];
}

interface CreateEventResponse {
  message: string;
  event: Event;
}

interface FormValues {
  name: string;
  sections: {
    name: string;
    rows: { name: string; totalSeats: number }[];
  }[];
}

const API_BASE_URL = 'http://localhost:8888';

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get<EventsResponse>(`${API_BASE_URL}/events`);
        if (!response.data.event) throw new Error('No events found');
        setEvents(response.data.event);
      } catch (err: unknown) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleCreateEvent = async (values: FormValues, { setSubmitting, resetForm }: any) => {
    setModalError(null);
    try {
      const response = await axios.post<CreateEventResponse>(`${API_BASE_URL}/events`, values);
      if (response.data.event) {
        setEvents((prevEvents) => [...prevEvents, response.data.event]);
        setShowModal(false);
        resetForm();
      }
    } catch (err: unknown) {
      setModalError((err as Error).message || 'Failed to create event');
    } finally {
      setSubmitting(false);
    }
  };

  const validationSchema = Yup.object({
    name: Yup.string().required('Event name is required'),
    sections: Yup.array()
      .of(
        Yup.object().shape({
          name: Yup.string().required('Section name is required'),
          rows: Yup.array()
            .of(
              Yup.object().shape({
                name: Yup.string().required('Row name is required'),
                totalSeats: Yup.number()
                  .required('Total seats are required')
                  .min(1, 'Total seats must be at least 1'),
              })
            )
            .min(1, 'At least one row is required')
            .required('Rows are required'),
        })
      )
      .min(1, 'At least one section is required')
      .required('Sections are required'),
  });

  const initialValues: FormValues = {
    name: '',
    sections: [{ name: '', rows: [{ name: '', totalSeats: 1 }] }],
  };

  if (loading) return <Spinner animation="border" className="d-block mx-auto mt-5" />;
  if (error) return <Alert variant="danger" className="mt-5">{error}</Alert>;

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Available Events</h2>
        <Button variant="success" onClick={() => setShowModal(true)}>
          Add New Event
        </Button>
      </div>
      <Row>
        {events.map((event) => (
          <Col md={4} key={event._id}>
            <Card className="event-card">
              <Card.Body>
                <Card.Title>{event.name}</Card.Title>
                <Card.Text>Date: {new Date(event.createdAt).toLocaleString()}</Card.Text>
                <Link href={`/event/${event._id}`} passHref>
                  <Button variant="primary">View Details</Button>
                </Link>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal for Adding New Event */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalError && <Alert variant="danger" className="mb-3">{modalError}</Alert>}
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleCreateEvent}
          >
            {({ values, isSubmitting, setFieldValue }) => (
              <Form>
                <BootstrapForm.Group className="mb-3">
                  <BootstrapForm.Label htmlFor="name">Event Name</BootstrapForm.Label>
                  <Field id="name" name="name" className="form-control" />
                  <ErrorMessage name="name" component="div" className="text-danger" />
                </BootstrapForm.Group>

                {/* <FieldArray name="sections">
                  {({ push, remove }) => (
                    <>
                      {values.sections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-4 p-3 border rounded">
                          <BootstrapForm.Group className="mb-3">
                            <BootstrapForm.Label htmlFor={`sections[${sectionIndex}].name`}>
                              Section Name
                            </BootstrapForm.Label>
                            <Field
                              id={`sections[${sectionIndex}].name`}
                              name={`sections[${sectionIndex}].name`}
                              className="form-control"
                            />
                            <ErrorMessage
                              name={`sections[${sectionIndex}].name`}
                              component="div"
                              className="text-danger"
                            />
                          </BootstrapForm.Group>

                          <FieldArray name={`sections[${sectionIndex}].rows`}>
                            {({ push: pushRow, remove: removeRow }) => (
                              <>
                                {section.rows.map((row, rowIndex) => (
                                  <div key={rowIndex} className="mb-3 d-flex gap-2">
                                    <BootstrapForm.Group className="flex-grow-1">
                                      <BootstrapForm.Label
                                        htmlFor={`sections[${sectionIndex}].rows[${rowIndex}].name`}
                                      >
                                        Row Name
                                      </BootstrapForm.Label>
                                      <Field
                                        id={`sections[${sectionIndex}].rows[${rowIndex}].name`}
                                        name={`sections[${sectionIndex}].rows[${rowIndex}].name`}
                                        className="form-control"
                                      />
                                      <ErrorMessage
                                        name={`sections[${sectionIndex}].rows[${rowIndex}].name`}
                                        component="div"
                                        className="text-danger"
                                      />
                                    </BootstrapForm.Group>
                                    <BootstrapForm.Group className="flex-grow-1">
                                      <BootstrapForm.Label
                                        htmlFor={`sections[${sectionIndex}].rows[${rowIndex}].totalSeats`}
                                      >
                                        Total Seats
                                      </BootstrapForm.Label>
                                      <Field
                                        type="number"
                                        id={`sections[${sectionIndex}].rows[${rowIndex}].totalSeats`}
                                        name={`sections[${sectionIndex}].rows[${rowIndex}].totalSeats`}
                                        className="form-control"
                                        min="1"
                                      />
                                      <ErrorMessage
                                        name={`sections[${sectionIndex}].rows[${rowIndex}].totalSeats`}
                                        component="div"
                                        className="text-danger"
                                      />
                                    </BootstrapForm.Group>
                                    <Button
                                      variant="danger"
                                      className="mt-4"
                                      onClick={() => removeRow(rowIndex)}
                                      disabled={section.rows.length <= 1}
                                    >
                                      Remove Row
                                    </Button>
                                  </div>
                                ))}
                                <Button
                                  variant="secondary"
                                  onClick={() =>
                                    pushRow({ name: '', totalSeats: 1 })
                                  }
                                >
                                  Add Row
                                </Button>
                              </>
                            )}
                          </FieldArray>

                          {sectionIndex > 0 && (
                            <Button
                              variant="danger"
                              className="ms-2"
                              onClick={() => remove(sectionIndex)}
                            >
                              Remove Section
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="secondary"
                        onClick={() =>
                          push({ name: '', rows: [{ name: '', totalSeats: 1 }] })
                        }
                      >
                        Add Section
                      </Button>
                      <ErrorMessage name="sections" component="div" className="text-danger mt-2" />
                    </>
                  )}
                </FieldArray> */}

<FieldArray name="sections">
            {({ push: pushSection, remove: removeSection }) => (
              <>
                {values.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-4 p-3 border rounded">
                    <BootstrapForm.Group className="mb-3">
                      <BootstrapForm.Label htmlFor={`sections[${sectionIndex}].name`}>
                        Section Name
                      </BootstrapForm.Label>
                      <Field
                        id={`sections[${sectionIndex}].name`}
                        name={`sections[${sectionIndex}].name`}
                        className="form-control"
                      />
                      <ErrorMessage
                        name={`sections[${sectionIndex}].name`}
                        component="div"
                        className="text-danger"
                      />
                    </BootstrapForm.Group>

                    <FieldArray name={`sections[${sectionIndex}].rows`}>
                      {({ push: pushRow, remove: removeRow }) => (
                        <>
                          {section.rows.map((row, rowIndex) => (
                            <div key={rowIndex} className="mb-3 d-flex gap-2 align-items-end">
                              <BootstrapForm.Group className="flex-grow-1">
                                <BootstrapForm.Label
                                  htmlFor={`sections[${sectionIndex}].rows[${rowIndex}].name`}
                                >
                                  Row Name
                                </BootstrapForm.Label>
                                <Field
                                  id={`sections[${sectionIndex}].rows[${rowIndex}].name`}
                                  name={`sections[${sectionIndex}].rows[${rowIndex}].name`}
                                  className="form-control"
                                />
                                <ErrorMessage
                                  name={`sections[${sectionIndex}].rows[${rowIndex}].name`}
                                  component="div"
                                  className="text-danger"
                                />
                              </BootstrapForm.Group>

                              <BootstrapForm.Group className="flex-grow-1">
                                <BootstrapForm.Label
                                  htmlFor={`sections[${sectionIndex}].rows[${rowIndex}].totalSeats`}
                                >
                                  Total Seats
                                </BootstrapForm.Label>
                                <Field
                                  type="number"
                                  id={`sections[${sectionIndex}].rows[${rowIndex}].totalSeats`}
                                  name={`sections[${sectionIndex}].rows[${rowIndex}].totalSeats`}
                                  className="form-control"
                                  min="1"
                                />
                                <ErrorMessage
                                  name={`sections[${sectionIndex}].rows[${rowIndex}].totalSeats`}
                                  component="div"
                                  className="text-danger"
                                />
                              </BootstrapForm.Group>

                              <Button
                                variant="danger"
                                onClick={() => removeRow(rowIndex)}
                                disabled={section.rows.length <= 1}
                              >
                                Remove Row
                              </Button>
                            </div>
                          ))}

                          <Button
                            variant="secondary"
                            onClick={() => pushRow({ name: "", totalSeats: 1 })}
                          >
                            Add Row
                          </Button>
                        </>
                      )}
                    </FieldArray>

                    {sectionIndex > 0 && (
                      <Button
                        variant="danger"
                        className="mt-2"
                        onClick={() => removeSection(sectionIndex)}
                      >
                        Remove Section
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="secondary"
                  onClick={() =>
                    pushSection({ name: "", rows: [{ name: "", totalSeats: 1 }] })
                  }
                >
                  Add Section
                </Button>
              </>
            )}
          </FieldArray>

                <div className="mt-4">
                  <Button variant="primary" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Event'}
                  </Button>
                  <Button
                    variant="secondary"
                    className="ms-2"
                    onClick={() => setShowModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Modal.Body>
      </Modal>
    </div>
  );
}