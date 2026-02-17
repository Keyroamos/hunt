import { motion } from 'framer-motion'

const Terms = () => {
    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-2xl shadow-sm p-8 md:p-12"
                >
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Terms and Conditions
                        </h1>
                        <p className="text-gray-600">
                            Last updated: January 14, 2026
                        </p>
                    </div>

                    <div className="prose prose-orange max-w-none space-y-8 text-gray-600">
                        <p className="text-lg">
                            Welcome to Househunt.co.ke ("Platform", "we", "us", or "our"). These Terms and Conditions ("Terms") govern your access to and use of the Househunt.co.ke website and any related services (collectively, the "Services").
                        </p>
                        <p>
                            By accessing or using the Services, you agree to be bound by these Terms. If you do not agree with any part of these Terms, you must not use the Services.
                        </p>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Description of Services</h2>
                            <p>Househunt.co.ke is an online platform that allows users to:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Search and browse rental property listings across Kenya (including apartments, houses, and other residential rentals in areas such as Nairobi, Mombasa, Kisumu, and others).</li>
                                <li>List rental properties (as property owners or agents).</li>
                                <li>Contact verified property owners or renters directly.</li>
                                <li>Use features like advanced search filters, map view, and profile creation.</li>
                            </ul>
                            <p className="mt-4">
                                The Platform acts solely as a facilitator and does not own, manage, lease, sell, or provide any properties. All rental agreements, viewings, payments, and transactions occur directly between users (renters and property owners/agents). We do not act as an estate agent, broker, or party to any rental contract.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
                            <p>
                                You must be at least 18 years old (or the age of majority in Kenya) to use the Services. By using the Services, you represent and warrant that you meet this requirement and have the legal capacity to enter into these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                            <p>To list properties or access certain features, you may need to create an account. You are responsible for:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Maintaining the confidentiality of your account credentials.</li>
                                <li>All activities under your account.</li>
                                <li>Providing accurate, current, and complete information.</li>
                            </ul>
                            <p className="mt-4">
                                We reserve the right to suspend or terminate accounts for any violation of these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content and Listings</h2>
                            <p>You are solely responsible for any content you post (listings, photos, descriptions, contact details, etc.). You represent and warrant that:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Your content is accurate and not misleading.</li>
                                <li>You have the right to post it (including necessary permissions for photos).</li>
                                <li>It does not infringe third-party rights or violate any laws.</li>
                            </ul>
                            <p className="mt-4">
                                We may (but are not obligated to) review, remove, or edit content that we deem inappropriate, illegal, or in violation of these Terms.
                            </p>
                            <p className="mt-2 font-medium">
                                All listings must relate to genuine rental properties available in Kenya.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Payments (If Applicable)</h2>
                            <p>Certain features (such as premium/featured listings, advertising packages, subscriptions, or other paid services) may require payment.</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>All payments are processed through secure third-party payment gateways.</li>
                                <li>Prices are quoted in Kenyan Shillings (KES) and inclusive of any applicable taxes unless stated otherwise.</li>
                                <li>By making a payment, you agree to these Terms and our payment terms.</li>
                            </ul>

                            <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">No Refunds Policy</h3>
                            <p>
                                All payments made to Househunt.co.ke are final and non-refundable. We do not offer refunds, credits, or reversals for any reason, including but not limited to:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Change of mind.</li>
                                <li>Unused services.</li>
                                <li>Dissatisfaction with the Services.</li>
                                <li>Failure to secure a tenant or property.</li>
                                <li>Cancellation of your account or listing.</li>
                            </ul>
                            <p className="mt-4">
                                This no-refund policy applies to all transactions once payment has been successfully processed.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Prohibited Activities</h2>
                            <p>You agree not to:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>Post false, fraudulent, or misleading listings.</li>
                                <li>Use the Services for any illegal purpose.</li>
                                <li>Harass, spam, or impersonate others.</li>
                                <li>Attempt to gain unauthorized access to the Platform.</li>
                                <li>Scrape, copy, or reproduce listings without permission.</li>
                                <li>Post discriminatory, obscene, or harmful content.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Disclaimers</h2>
                            <p>The Services are provided "as is" and "as available" without warranties of any kind. We do not warrant that:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>The Services will be uninterrupted, error-free, or secure.</li>
                                <li>Listings are accurate, complete, or current.</li>
                                <li>Any rental transaction will be successful.</li>
                            </ul>
                            <p className="mt-4 font-bold">We disclaim all liability for:</p>
                            <ul className="list-disc pl-5 space-y-2 mt-2">
                                <li>The conduct, acts, or omissions of any users (renters, owners, agents).</li>
                                <li>The condition, legality, or availability of any listed property.</li>
                                <li>Any disputes arising from rental agreements.</li>
                            </ul>
                            <p className="mt-4 italic">
                                Users are strongly advised to conduct their own due diligence, verify property details, meet in person, and use written tenancy agreements compliant with Kenyan law.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
                            <p>
                                To the fullest extent permitted by law, Househunt.co.ke, its owners, employees, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Services, even if advised of the possibility of such damages.
                            </p>
                            <p className="mt-4">
                                Our total liability shall not exceed the amount you paid us (if any) in the twelve (12) months preceding the claim.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
                            <p>
                                You agree to indemnify and hold us harmless from any claims, losses, liabilities, damages, costs, and expenses (including reasonable legal fees) arising from your use of the Services, your content, or your violation of these Terms or any law.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
                            <p>
                                We may terminate or suspend your access to the Services at any time, without notice, for any reason, including breach of these Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law and Dispute Resolution</h2>
                            <p>
                                These Terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved exclusively in the courts of Nairobi, Kenya.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
                            <p>
                                We may update these Terms at any time. Continued use of the Services after changes constitutes acceptance of the new Terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Us</h2>
                            <p>For questions about these Terms, contact us at:</p>
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="font-medium text-gray-900">info@househunt.co.ke</p>
                            </div>
                        </section>

                        <div className="mt-12 pt-8 border-t border-gray-100">
                            <p className="text-sm text-gray-500">
                                By using Househunt.co.ke, you acknowledge that you have read, understood, and agree to these Terms and Conditions.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

export default Terms
