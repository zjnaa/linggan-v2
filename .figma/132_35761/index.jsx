import React from 'react';

import styles from './index.module.scss';

const Component = () => {
  return (
    <div className={styles.chatInput}>
      <div className={styles.frame2147239953}>
        <div className={styles.frame2147240104}>
          <div className={styles.contextTag}>
            <div className={styles.tag}>
              <div className={styles.icon}>
                <img src="../image/mqgolfv0-mta1ydw.svg" className={styles.frame} />
              </div>
              <p className={styles.visualNarrativeSyste}>visual narrative system</p>
            </div>
          </div>
          <p className={styles.text}>描述你想补充的主题,例如「给</p>
        </div>
        <p className={styles.text}>视觉叙事系统补素材」</p>
      </div>
      <div className={styles.inputBottomActions}>
        <div className={styles.env}>
          <img src="../image/mqgolfv0-3w6p21w.svg" className={styles.icon16Add} />
        </div>
        <div className={styles.r}>
          <div className={styles.frame2147240033}>
            <img src="../image/mqgolfv0-g3cqo8r.svg" className={styles.icon16Add} />
          </div>
          <img
            src="../image/mqgolfv0-ep6p3cs.svg"
            className={styles.frame2147240062}
          />
        </div>
      </div>
    </div>
  );
}

export default Component;
