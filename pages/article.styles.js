export const detailStyle = `
  .root {
    padding: 24px;
  }
  @media screen and (min-width: 768px) {
    .root {
      padding: 40px;
    }
  }
  .section {
    margin-bottom: 64px;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .message {
    border: 1px solid #ccc;
    background: #eee;
    border-radius: 3px;
    padding: 24px;
  }
  .items {
    list-style-type: none;
    padding-left: 0;
  }
`;

export const tabMenuStyle = `
  .tabs {
    display: flex;
    font-size: 18px;
    font-weight: 500;
    margin: 0;
    padding: 0;
  }
  .tabs li {
    list-style: none;
  }
  .tab {
    padding: 16px 24px;
    border: 1px solid #ccc;
    background: #eee;
    display: flex;
    align-items: center;
  }
  .tab:hover {
    background: #f8f8f8;
  }
  .tab + .tab {
    border-left: 0;
  }
  .tab.active {
    border-bottom-color: transparent;
    background: #fff;
  }
  .badge {
    background: #999;
    color: #fff;
    padding: 2px 8px;
    border-radius: 100%;
    font-size: 0.75em;
    margin-left: 8px;
  }
  .empty {
    flex: 1;
    border-bottom: 1px solid #ccc;
  }
`;
