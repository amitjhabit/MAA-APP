import React from 'react'
import simage_img1 from '../saraswatiPuja/images/img-1.jpg';
import simage_img2 from '../saraswatiPuja/images/img-2.jpg';
import simage_img3 from '../saraswatiPuja/images/img-3.jpg';
import simage_img4 from '../saraswatiPuja/images/img-4.jpg';
import simage_img5 from '../saraswatiPuja/images/img-5.jpg';
import simage_img6 from '../saraswatiPuja/images/img-6.jpg';
import { Link } from 'react-router-dom';
import './SPojaDetails.css';
import Footer from '../Footer';
const SPojaDetails = () => {
  return (
    <>
    <div className='spoja_details'>
        <div className='spoja_container'>
            <h3>Saraswati Puja Details</h3>
            <p>
              MAA hosted its first grand and marvelous Saraswati Pooja on February 2nd. The pooja was conducted entirely by children, who fasted, chanted all the mantras, and performed the rituals with devotion and precision. It was a deeply enriching experience for them, as they had the opportunity to witness and engage with our Hindu culture firsthand.
              This event would not have been possible without our dedicated volunteers, and the best part was that the majority of them were children. What a wonderful way to honor Maa Saraswati! A heartfelt appreciation goes out to all the volunteers who participated in prasad preparation (buniya), decoration, organizing children's activities (kite flying and the drawing competition), and much more. 
              Thank you to each and every one of you for joining us and making this event a grand success!
            </p>
            <div className='spoja_main'>
                <span>Date: 2 Febuary 2025</span>
                <div className='spoja_img'>
                    <img src={simage_img1} alt=''/>
                </div>

                <div className='spoja_img'>
                    <img src={simage_img2} alt=''/>
                </div>

                <div className='spoja_img'>
                    <img src={simage_img3} alt=''/>
                </div>

                 <div className='spoja_img'>
                    <img src={simage_img4} alt=''/>
                </div>

                 <div className='spoja_img'>
                    <img src={simage_img5} alt=''/>
                </div>

                 <div className='spoja_img'>
                    <img src={simage_img6} alt=''/>
                </div>
            </div>
            <Link to='/news'>Back</Link>
        </div>
    </div>
    <Footer/>
    </>
  )
}

export default SPojaDetails